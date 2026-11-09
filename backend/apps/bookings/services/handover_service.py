import hmac
import hashlib
import secrets
from datetime import timedelta
from typing import Tuple, Dict, Any, Optional
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError, PermissionDenied

from apps.bookings.models import (
    Booking,
    HandoverVerification,
    HandoverVerificationEvent,
    HandoverEvidence,
)
from apps.bookings.services.booking_state_machine import (
    BookingStateMachine,
    InvalidStateTransitionError,
    BookingPermissionError,
)
from apps.notifications.services import send_notification


class HandoverSecurityError(Exception):
    """Raised when credential verification fails or rate limits are exceeded."""
    pass


class HandoverService:
    """
    Authoritative service governing in-person campus handover and return verification.
    Uses SHA-256 cryptographic hashing to store zero plaintext secrets in the database.
    Integrates directly with the Phase 07 Booking State Machine.
    """

    OTP_LENGTH = 6
    TOKEN_VALIDITY_MINUTES = 10
    MAX_FAILED_ATTEMPTS = 5
    RESEND_COOLDOWN_SECONDS = 30

    @classmethod
    def hash_secret(cls, raw_secret: str) -> str:
        """Computes keyed HMAC SHA-256 hash of a secret credential."""
        key = getattr(settings, 'SECRET_KEY', 'renttogether-handover-key').encode('utf-8')
        return hmac.new(key, raw_secret.strip().encode('utf-8'), hashlib.sha256).hexdigest()

    @classmethod
    def verify_secret(cls, raw_secret: str, stored_hash: str) -> bool:
        """Constant-time verification of raw credential against stored hash."""
        if not raw_secret or not stored_hash:
            return False
        computed = cls.hash_secret(raw_secret)
        return hmac.compare_digest(computed, stored_hash)

    @classmethod
    @transaction.atomic
    def get_or_create_pass(
        cls,
        booking: Booking,
        user,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Retrieves or securely generates raw credentials for the appropriate participant:
          - PICKUP Pass: displayed by Owner when booking is in PAID_CONFIRMED.
          - RETURN Pass: displayed by Renter when booking is in ACTIVE.
        Returns the ephemeral unhashed secrets to the authorized user only.
        """
        verification, _ = HandoverVerification.objects.select_for_update(of=('self',)).get_or_create(booking=booking)
        now = timezone.now()

        # Determine Stage & Authorization
        if booking.status == Booking.STATUS_PAID_CONFIRMED:
            stage = 'PICKUP'
            if user != booking.owner and not getattr(user, 'is_staff', False):
                raise BookingPermissionError("Only the equipment owner can retrieve the Pickup Pass.")
            
            # Check existing valid credentials
            if (
                not force_regenerate
                and verification.pickup_token_expires_at
                and verification.pickup_token_expires_at > now
                and verification.pickup_qr_token_hash
                and not verification.pickup_verified
            ):
                # Cannot recover raw OTP from hash; if expired or not yet cached, generate fresh
                pass

            # Generate fresh pickup credentials
            raw_otp = f"{secrets.randbelow(1000000):06d}"
            raw_token = secrets.token_urlsafe(32)
            expires_at = now + timedelta(minutes=cls.TOKEN_VALIDITY_MINUTES)

            verification.pickup_otp_hash = cls.hash_secret(raw_otp)
            verification.pickup_qr_token_hash = cls.hash_secret(raw_token)
            verification.pickup_token_expires_at = expires_at
            verification.pickup_attempt_count = 0
            verification.save()

            # Record audit event
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='PICKUP_OTP_GENERATED' if not force_regenerate else 'TOKEN_REVOKED',
                performed_by=user,
                verification_method='SYSTEM',
                success=True,
                metadata={'stage': 'PICKUP', 'expires_at': expires_at.isoformat()}
            )

            qr_payload = f"RT-PASS:PICKUP:{booking.booking_code}:{raw_token}"
            return {
                'booking_code': booking.booking_code,
                'stage': 'PICKUP',
                'otp': raw_otp,
                'token': raw_token,
                'qr_payload': qr_payload,
                'pickup_spot': booking.pickup_spot or getattr(booking.item, 'pickup_location', 'Campus Center'),
                'expires_at': expires_at.isoformat(),
                'item_title': booking.item_title,
                'counterpart_name': booking.renter.get_full_name() or booking.renter.email,
            }

        elif booking.status == Booking.STATUS_ACTIVE:
            stage = 'RETURN'
            if user != booking.renter and not getattr(user, 'is_staff', False):
                raise BookingPermissionError("Only the renter can retrieve the Return Pass.")

            # Generate fresh return credentials
            raw_otp = f"{secrets.randbelow(1000000):06d}"
            raw_token = secrets.token_urlsafe(32)
            expires_at = now + timedelta(minutes=cls.TOKEN_VALIDITY_MINUTES)

            verification.return_otp_hash = cls.hash_secret(raw_otp)
            verification.return_qr_token_hash = cls.hash_secret(raw_token)
            verification.return_token_expires_at = expires_at
            verification.return_attempt_count = 0
            verification.save()

            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='RETURN_OTP_GENERATED' if not force_regenerate else 'TOKEN_REVOKED',
                performed_by=user,
                verification_method='SYSTEM',
                success=True,
                metadata={'stage': 'RETURN', 'expires_at': expires_at.isoformat()}
            )

            qr_payload = f"RT-PASS:RETURN:{booking.booking_code}:{raw_token}"
            return {
                'booking_code': booking.booking_code,
                'stage': 'RETURN',
                'otp': raw_otp,
                'token': raw_token,
                'qr_payload': qr_payload,
                'pickup_spot': booking.pickup_spot or 'Campus Center',
                'expires_at': expires_at.isoformat(),
                'item_title': booking.item_title,
                'counterpart_name': booking.owner.get_full_name() or booking.owner.email,
            }

        else:
            raise ValidationError(
                f"Handover credentials are not available for booking in status '{booking.status}'."
            )

    @classmethod
    def verify_pickup(
        cls,
        booking: Booking,
        renter_user,
        method: str,
        credential: str,
        pickup_condition: str = 'GOOD',
        pickup_notes: str = ""
    ) -> Booking:
        """
        Renter confirms physical receipt of the equipment from the Owner.
        Transitions booking: PAID_CONFIRMED -> ACTIVE via Phase 07 BookingStateMachine.
        Failed attempts are persisted so rate limits are reliably enforced.
        """
        verification, _ = HandoverVerification.objects.get_or_create(booking=booking)

        if renter_user != booking.renter and not getattr(renter_user, 'is_staff', False):
            raise BookingPermissionError("Only the renter can confirm physical pickup of the equipment.")

        if booking.status != Booking.STATUS_PAID_CONFIRMED:
            raise InvalidStateTransitionError(
                f"Cannot verify pickup for booking in status '{booking.status}'.",
                current_status=booking.status,
                attempted_action="VERIFY_PICKUP"
            )

        if verification.pickup_verified:
            return booking

        # Check attempt count / rate limiting
        if verification.pickup_attempt_count >= cls.MAX_FAILED_ATTEMPTS:
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='VERIFICATION_FAILED',
                performed_by=renter_user,
                verification_method=method,
                success=False,
                failure_reason="Max verification attempts exceeded. Regenerate pass."
            )
            raise HandoverSecurityError("Maximum failed verification attempts reached. Please ask the owner to regenerate the pass.")

        now = timezone.now()
        if not verification.pickup_token_expires_at or now > verification.pickup_token_expires_at:
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='TOKEN_EXPIRED',
                performed_by=renter_user,
                verification_method=method,
                success=False,
                failure_reason="Pickup token has expired."
            )
            raise HandoverSecurityError("Pickup pass has expired. Please ask the owner to regenerate.")

        # Clean credential string (strip QR prefix if scanned via QR reader)
        clean_cred = credential.strip()
        if clean_cred.startswith("RT-PASS:PICKUP:"):
            parts = clean_cred.split(":")
            if len(parts) >= 4:
                clean_cred = parts[3]

        # Verify against either OTP hash or QR token hash
        is_valid = False
        if method.upper() == 'OTP':
            is_valid = cls.verify_secret(clean_cred, verification.pickup_otp_hash)
        else:
            is_valid = cls.verify_secret(clean_cred, verification.pickup_qr_token_hash)

        if not is_valid:
            verification.pickup_attempt_count += 1
            verification.save(update_fields=['pickup_attempt_count', 'updated_at'])
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='PICKUP_VERIFICATION_ATTEMPT',
                performed_by=renter_user,
                verification_method=method,
                success=False,
                failure_reason=f"Invalid {method} code."
            )
            raise HandoverSecurityError(f"Incorrect {method} passcode. Please verify with the owner.")

        # Successful Verification: Mark Handover Record Atomically
        with transaction.atomic():
            booking = Booking.objects.select_for_update(of=('self',)).get(id=booking.id)
            verification = HandoverVerification.objects.select_for_update(of=('self',)).get(id=verification.id)

            verification.pickup_verified = True
            verification.pickup_confirmed_at = now
            verification.pickup_confirmed_by = renter_user
            verification.pickup_condition = pickup_condition
            verification.pickup_notes = pickup_notes
            verification.pickup_token_used_at = now
            # Invalidate hashes to ensure single-use
            verification.pickup_otp_hash = ""
            verification.pickup_qr_token_hash = ""
            verification.save()

            # Audit Event
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='PICKUP_VERIFIED',
                performed_by=renter_user,
                verification_method=method,
                success=True,
                metadata={'condition': pickup_condition, 'notes': pickup_notes}
            )

            # Transition Booking to ACTIVE via Phase 07 State Machine
            booking = BookingStateMachine.confirm_handover(
                booking_id=str(booking.id),
                actor_user=renter_user,
                pass_code=booking.handover_pass_code
            )

        return booking

    @classmethod
    def verify_return(
        cls,
        booking: Booking,
        owner_user,
        method: str,
        credential: str,
        return_condition: str = 'SAME',
        return_notes: str = ""
    ) -> Booking:
        """
        Owner confirms physical handback of equipment from the Renter on campus.
        Transitions booking: ACTIVE -> RETURNED_PENDING_INSPECTION via Phase 07 BookingStateMachine.
        Failed attempts are persisted so rate limits are reliably enforced.
        """
        verification, _ = HandoverVerification.objects.get_or_create(booking=booking)

        if owner_user != booking.owner and not getattr(owner_user, 'is_staff', False):
            raise BookingPermissionError("Only the equipment owner can verify the physical return handback.")

        if booking.status != Booking.STATUS_ACTIVE:
            raise InvalidStateTransitionError(
                f"Cannot verify return for booking in status '{booking.status}'.",
                current_status=booking.status,
                attempted_action="VERIFY_RETURN"
            )

        if verification.return_verified:
            return booking

        # Check attempt limits
        if verification.return_attempt_count >= cls.MAX_FAILED_ATTEMPTS:
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='VERIFICATION_FAILED',
                performed_by=owner_user,
                verification_method=method,
                success=False,
                failure_reason="Max return attempts exceeded."
            )
            raise HandoverSecurityError("Maximum failed return attempts reached. Please ask the renter to regenerate the return pass.")

        now = timezone.now()
        if not verification.return_token_expires_at or now > verification.return_token_expires_at:
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='TOKEN_EXPIRED',
                performed_by=owner_user,
                verification_method=method,
                success=False,
                failure_reason="Return token has expired."
            )
            raise HandoverSecurityError("Return pass has expired. Please ask the renter to regenerate.")

        # Clean credential string
        clean_cred = credential.strip()
        if clean_cred.startswith("RT-PASS:RETURN:"):
            parts = clean_cred.split(":")
            if len(parts) >= 4:
                clean_cred = parts[3]

        is_valid = False
        if method.upper() == 'OTP':
            is_valid = cls.verify_secret(clean_cred, verification.return_otp_hash)
        else:
            is_valid = cls.verify_secret(clean_cred, verification.return_qr_token_hash)

        if not is_valid:
            verification.return_attempt_count += 1
            verification.save(update_fields=['return_attempt_count', 'updated_at'])
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='RETURN_VERIFICATION_ATTEMPT',
                performed_by=owner_user,
                verification_method=method,
                success=False,
                failure_reason=f"Invalid {method} code."
            )
            raise HandoverSecurityError(f"Incorrect {method} passcode. Please verify with the renter.")

        # Atomically mark return verified and invoke Phase 07 state machine
        with transaction.atomic():
            booking = Booking.objects.select_for_update(of=('self',)).get(id=booking.id)
            verification = HandoverVerification.objects.select_for_update(of=('self',)).get(id=verification.id)

            verification.return_verified = True
            verification.return_confirmed_at = now
            verification.return_confirmed_by = owner_user
            verification.return_item_condition = return_condition
            verification.return_notes = return_notes
            verification.return_token_used_at = now
            verification.return_otp_hash = ""
            verification.return_qr_token_hash = ""
            verification.save()

            # Audit Event
            HandoverVerificationEvent.objects.create(
                booking=booking,
                event_type='RETURN_VERIFIED',
                performed_by=owner_user,
                verification_method=method,
                success=True,
                metadata={'condition': return_condition, 'notes': return_notes}
            )

            # Transition Booking to RETURNED_PENDING_INSPECTION via Phase 07 State Machine
            booking = BookingStateMachine.initiate_return(
                booking_id=str(booking.id),
                renter_user=owner_user,
                return_notes=return_notes or f"Return verified on campus with condition: {return_condition}"
            )

        return booking

    @classmethod
    @transaction.atomic
    def record_evidence(
        cls,
        booking: Booking,
        user,
        stage: str,
        image_url: str,
        caption: str = ""
    ) -> HandoverEvidence:
        """Saves photo evidence for pickup or return inspection."""
        if user not in (booking.owner, booking.renter) and not getattr(user, 'is_staff', False):
            raise BookingPermissionError("Only booking participants can attach handover evidence.")

        evidence = HandoverEvidence.objects.create(
            booking=booking,
            evidence_stage=stage.upper(),
            uploaded_by=user,
            image_url=image_url,
            caption=caption
        )
        return evidence

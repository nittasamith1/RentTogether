from datetime import timedelta
from typing import Optional, Dict, Any
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.bookings.models import Booking, BookingStatusHistory
from apps.listings.models import Item
from apps.availability.models import ItemAvailabilityBlock
from apps.availability.services.availability_service import (
    AvailabilityService,
    AvailabilityConflictError,
)
from apps.notifications.services import send_notification


class InvalidStateTransitionError(Exception):
    """Raised when an illegal booking state transition is attempted."""
    def __init__(self, message: str, current_status: str, attempted_action: str):
        super().__init__(message)
        self.current_status = current_status
        self.attempted_action = attempted_action


class BookingPermissionError(Exception):
    """Raised when an unauthorized actor attempts a booking operation."""
    pass


class BookingDeadlineExpiredError(Exception):
    """Raised when an operation is attempted after an approval or payment deadline has passed."""
    pass


class BookingStateMachine:
    """
    Central authoritative state machine managing all booking lifecycle transitions.
    Enforces atomic DB execution, row locking, availability integration, and audit history.
    """

    APPROVAL_WINDOW_HOURS = 24
    PAYMENT_WINDOW_HOURS = 12

    @classmethod
    @transaction.atomic
    def record_transition(
        cls,
        booking: Booking,
        previous_status: str,
        new_status: str,
        changed_by=None,
        reason: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> BookingStatusHistory:
        """Creates an immutable audit history record for this transition."""
        return BookingStatusHistory.objects.create(
            booking=booking,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=changed_by,
            reason=reason,
            metadata=metadata or {}
        )

    @classmethod
    @transaction.atomic
    def approve_by_owner(cls, booking_id: str, owner_user) -> Booking:
        """
        Owner approves a pending booking request.
        Reserves the item's availability with a 12-hour payment hold atomically.
        """
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if booking.owner != owner_user:
            raise BookingPermissionError("Only the item owner can approve this booking request.")

        if booking.status != Booking.STATUS_PENDING_APPROVAL:
            raise InvalidStateTransitionError(
                f"Booking in status '{booking.status}' cannot be approved.",
                current_status=booking.status,
                attempted_action="APPROVE"
            )

        now = timezone.now()
        if booking.approval_deadline and now > booking.approval_deadline:
            raise BookingDeadlineExpiredError("The 24-hour approval window for this booking has expired.")

        # Row-lock item
        Item.objects.select_for_update(of=('self',)).get(id=booking.item_id)

        # Re-check Phase 06 availability excluding this booking's own temporary hold
        existing_block = ItemAvailabilityBlock.objects.filter(booking_reference=booking).first()
        exclude_id = str(existing_block.id) if existing_block else None

        start_bound = booking.start_datetime or booking.start_date
        end_bound = booking.end_datetime or booking.end_date
        is_available, conflict = AvailabilityService.check_item_availability(
            booking.item,
            start_bound,
            end_bound,
            exclude_block_id=exclude_id
        )
        if not is_available:
            raise AvailabilityConflictError(
                f"Cannot approve: dates [{start_bound} to {end_bound}) conflict with existing {conflict.reason}.",
                conflicting_block=conflict
            )

        previous_status = booking.status
        booking.status = Booking.STATUS_APPROVED_PENDING_PAYMENT
        booking.approved_at = now
        booking.payment_deadline = now + timedelta(hours=cls.PAYMENT_WINDOW_HOURS)
        booking.save()

        # Phase 06 availability reservation hold
        AvailabilityService.create_booking_hold(
            booking=booking,
            expires_in_minutes=cls.PAYMENT_WINDOW_HOURS * 60
        )

        cls.record_transition(
            booking=booking,
            previous_status=previous_status,
            new_status=booking.status,
            changed_by=owner_user,
            reason="Owner approved rental request.",
            metadata={"payment_deadline": booking.payment_deadline.isoformat()}
        )

        # Notify Renter
        send_notification(
            recipient=booking.renter,
            actor=owner_user,
            event_type="BOOKING_APPROVED",
            title="Rental Request Approved!",
            message=f"{owner_user.first_name} approved your request for {booking.item_title}. Complete payment within 12 hours.",
            booking=booking
        )

        return booking

    @classmethod
    @transaction.atomic
    def reject_by_owner(cls, booking_id: str, owner_user, reason: str = "") -> Booking:
        """Owner rejects a pending booking request."""
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if booking.owner != owner_user:
            raise BookingPermissionError("Only the item owner can reject this booking request.")

        if booking.status != Booking.STATUS_PENDING_APPROVAL:
            raise InvalidStateTransitionError(
                f"Booking in status '{booking.status}' cannot be rejected.",
                current_status=booking.status,
                attempted_action="REJECT"
            )

        previous_status = booking.status
        booking.status = Booking.STATUS_REJECTED
        booking.rejection_reason = reason
        booking.save()

        # Release any hold if exists
        AvailabilityService.release_booking_block(booking)

        cls.record_transition(
            booking=booking,
            previous_status=previous_status,
            new_status=booking.status,
            changed_by=owner_user,
            reason=reason or "Owner declined the booking request."
        )

        # Notify Renter
        send_notification(
            recipient=booking.renter,
            actor=owner_user,
            event_type="BOOKING_REJECTED",
            title="Booking Request Declined",
            message=f"Your rental request for {booking.item_title} was declined by the owner.",
            booking=booking,
            metadata={"reason": reason}
        )

        return booking

    @classmethod
    @transaction.atomic
    def cancel_booking(cls, booking_id: str, user=None, reason: str = "") -> Booking:
        """
        Cancels a booking according to policy:
          - Renter can cancel PENDING_APPROVAL or APPROVED_PENDING_PAYMENT.
          - System can cancel on approval/payment timeout.
          - Paid bookings follow cancellation policy.
        """
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        allowed_cancel_states = [
            Booking.STATUS_PENDING_APPROVAL,
            Booking.STATUS_APPROVED_PENDING_PAYMENT,
            Booking.STATUS_PAID_CONFIRMED,
        ]

        if booking.status not in allowed_cancel_states:
            raise InvalidStateTransitionError(
                f"Cannot cancel booking in status '{booking.status}'.",
                current_status=booking.status,
                attempted_action="CANCEL"
            )

        if user and user not in (booking.renter, booking.owner) and not getattr(user, 'is_staff', False):
            raise BookingPermissionError("You do not have permission to cancel this booking.")

        previous_status = booking.status
        booking.status = Booking.STATUS_CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_at = timezone.now()
        booking.save()

        # Release availability hold immediately
        AvailabilityService.release_booking_block(booking)

        cls.record_transition(
            booking=booking,
            previous_status=previous_status,
            new_status=booking.status,
            changed_by=user,
            reason=reason or "Booking was cancelled."
        )

        # Notify participants
        other_party = booking.owner if user == booking.renter else booking.renter
        send_notification(
            recipient=other_party,
            actor=user,
            event_type="BOOKING_CANCELLED",
            title="Booking Cancelled",
            message=f"Booking {booking.booking_code} for {booking.item_title} was cancelled.",
            booking=booking,
            metadata={"reason": reason}
        )

        return booking

    @classmethod
    @transaction.atomic
    def record_cash_confirmation(cls, booking_id: str, actor_user) -> Booking:
        """
        RentTogether V1 Dual-Confirmation Offline Cash Payment:
        1. Renter clicks 'I Have Paid (Cash)'.
        2. Backend records renter confirmation timestamp and actor validation.
        3. Owner clicks 'Cash Received'.
        4. Backend records owner confirmation timestamp and actor validation.
        5. Backend validates that both confirmations correspond to the exact rental amount.
        6. When BOTH participants confirm, booking status transitions to CASH_PAYMENT_CONFIRMED (PAID_CONFIRMED).
        7. One user cannot confirm for the other (actor strictly verified from session).
        8. Confirms Phase 06 availability block permanently and activates pickup pass.
        """
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if booking.status not in (Booking.STATUS_APPROVED_PENDING_PAYMENT, 'APPROVED_PENDING_CASH_PAYMENT'):
            raise InvalidStateTransitionError(
                f"Booking in status '{booking.status}' cannot receive cash confirmation.",
                current_status=booking.status,
                attempted_action="CASH_CONFIRM"
            )

        now = timezone.now()
        if booking.payment_deadline and now > booking.payment_deadline:
            raise BookingDeadlineExpiredError("Cash confirmation deadline has expired. This booking reservation cannot be completed.")

        if actor_user != booking.renter and actor_user != booking.owner and not getattr(actor_user, 'is_staff', False):
            raise BookingPermissionError("Only booking participants (renter or owner) can confirm offline cash exchange.")

        is_renter = (actor_user == booking.renter)
        is_owner = (actor_user == booking.owner)

        if is_renter:
            if booking.renter_cash_confirmed:
                raise ValidationError("You have already confirmed handing over cash.")
            booking.renter_cash_confirmed = True
            booking.renter_cash_confirmed_at = now
            cls.record_transition(
                booking=booking,
                previous_status=booking.status,
                new_status=booking.status,
                changed_by=actor_user,
                reason=f"Renter confirmed handing over exact cash amount (₹{booking.total_rental_fee}).",
                metadata={"participant": "RENTER", "amount": str(booking.total_rental_fee), "timestamp": now.isoformat()}
            )
            send_notification(
                recipient=booking.owner,
                actor=actor_user,
                event_type="CASH_PAID_BY_RENTER",
                title="Renter Confirmed Cash Payment",
                message=f"{booking.renter.first_name} confirmed handing over ₹{booking.total_rental_fee} in cash. Please verify and confirm receipt.",
                booking=booking
            )

        elif is_owner:
            if booking.owner_cash_confirmed:
                raise ValidationError("You have already confirmed receiving cash.")
            booking.owner_cash_confirmed = True
            booking.owner_cash_confirmed_at = now
            cls.record_transition(
                booking=booking,
                previous_status=booking.status,
                new_status=booking.status,
                changed_by=actor_user,
                reason=f"Owner confirmed receiving exact cash amount (₹{booking.total_rental_fee}).",
                metadata={"participant": "OWNER", "amount": str(booking.total_rental_fee), "timestamp": now.isoformat()}
            )
            send_notification(
                recipient=booking.renter,
                actor=actor_user,
                event_type="CASH_RECEIVED_BY_OWNER",
                title="Owner Confirmed Cash Receipt",
                message=f"{booking.owner.first_name} confirmed receipt of ₹{booking.total_rental_fee} in cash.",
                booking=booking
            )

        # Transition to CASH_PAYMENT_CONFIRMED only once BOTH have confirmed
        if booking.renter_cash_confirmed and booking.owner_cash_confirmed:
            previous_status = booking.status
            booking.status = Booking.STATUS_PAID_CONFIRMED
            booking.paid_at = now
            booking.payment_method = 'OFFLINE_CASH'
            booking.save()

            # Confirm availability hold permanently
            AvailabilityService.confirm_booking_block(booking)

            cls.record_transition(
                booking=booking,
                previous_status=previous_status,
                new_status=booking.status,
                reason=f"Dual cash confirmation complete. Both parties confirmed ₹{booking.total_rental_fee}.",
                metadata={
                    "payment_method": "OFFLINE_CASH",
                    "total_amount": str(booking.total_rental_fee),
                    "renter_confirmed_at": booking.renter_cash_confirmed_at.isoformat(),
                    "owner_confirmed_at": booking.owner_cash_confirmed_at.isoformat(),
                }
            )

            # Notify both participants
            send_notification(
                recipient=booking.owner,
                event_type="CASH_PAYMENT_CONFIRMED",
                title="Cash Payment Verified & Confirmed!",
                message=f"Cash payment of ₹{booking.total_rental_fee} verified. Pickup pass is ready.",
                booking=booking
            )
            send_notification(
                recipient=booking.renter,
                event_type="CASH_PAYMENT_CONFIRMED",
                title="Cash Payment Verified & Confirmed!",
                message=f"Cash payment of ₹{booking.total_rental_fee} verified. Handover pass is ready.",
                booking=booking
            )
        else:
            booking.save()

        return booking

    @classmethod
    @transaction.atomic
    def confirm_payment(cls, booking_id: str, payment_id: str = "", metadata: Optional[Dict[str, Any]] = None) -> Booking:
        """
        Transitions booking to CASH_PAYMENT_CONFIRMED upon verified cash receipt.
        Confirms Phase 06 availability reservation permanently.
        """
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if booking.status not in (Booking.STATUS_APPROVED_PENDING_PAYMENT, 'APPROVED_PENDING_CASH_PAYMENT'):
            raise InvalidStateTransitionError(
                f"Booking in status '{booking.status}' cannot receive payment confirmation.",
                current_status=booking.status,
                attempted_action="PAYMENT_CONFIRM"
            )

        now = timezone.now()
        if booking.payment_deadline and now > booking.payment_deadline:
            raise BookingDeadlineExpiredError("Payment deadline has expired. This reservation cannot be completed.")

        previous_status = booking.status
        booking.status = Booking.STATUS_PAID_CONFIRMED
        booking.paid_at = now
        booking.payment_method = 'OFFLINE_CASH'
        booking.renter_cash_confirmed = True
        booking.renter_cash_confirmed_at = now
        booking.owner_cash_confirmed = True
        booking.owner_cash_confirmed_at = now
        booking.save()

        # Lock dates permanently in Phase 06 Availability
        AvailabilityService.confirm_booking_block(booking)

        meta = metadata or {}
        meta['payment_method'] = 'OFFLINE_CASH'
        if payment_id:
            meta['payment_id'] = payment_id

        cls.record_transition(
            booking=booking,
            previous_status=previous_status,
            new_status=booking.status,
            reason="In-person cash payment confirmed.",
            metadata=meta
        )

        # Notify both parties
        send_notification(
            recipient=booking.owner,
            event_type="PAYMENT_RECEIVED",
            title="Cash Payment Received!",
            message=f"Cash payment of ₹{booking.total_rental_fee} for {booking.item_title} is confirmed. Handover code is ready.",
            booking=booking
        )
        send_notification(
            recipient=booking.renter,
            event_type="PAYMENT_SUCCESSFUL",
            title="Cash Payment Confirmed!",
            message=f"Your cash payment for {booking.item_title} is confirmed. View your handover pass to pick up gear.",
            booking=booking
        )

        return booking

    @classmethod
    @transaction.atomic
    def confirm_handover(cls, booking_id: str, actor_user, pass_code: str) -> Booking:
        """
        Verifies single-use handover code and transitions booking to ACTIVE rental.
        """
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if booking.status != Booking.STATUS_PAID_CONFIRMED:
            raise InvalidStateTransitionError(
                f"Handover cannot be confirmed for booking in status '{booking.status}'.",
                current_status=booking.status,
                attempted_action="HANDOVER"
            )

        if actor_user not in (booking.owner, booking.renter):
            raise BookingPermissionError("Only booking participants can verify item handover.")

        clean_code = pass_code.strip().upper()
        if clean_code != booking.handover_pass_code.upper():
            raise ValidationError("Invalid Handover Pass code. Please check and try again.")

        previous_status = booking.status
        booking.status = Booking.STATUS_ACTIVE
        booking.handover_at = timezone.now()
        booking.save()

        cls.record_transition(
            booking=booking,
            previous_status=previous_status,
            new_status=booking.status,
            changed_by=actor_user,
            reason="Campus handover code verified. Item is now actively rented."
        )

        # Notify participants
        other_user = booking.renter if actor_user == booking.owner else booking.owner
        send_notification(
            recipient=other_user,
            actor=actor_user,
            event_type="HANDOVER_CONFIRMED",
            title="Handover Confirmed — Rental Active",
            message=f"Handover of {booking.item_title} confirmed. Return due on {booking.end_date}.",
            booking=booking
        )

        return booking

    @classmethod
    @transaction.atomic
    def initiate_return(cls, booking_id: str, renter_user, return_notes: str = "") -> Booking:
        """Renter completes physical handback, putting item in inspection status."""
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if booking.renter != renter_user and booking.owner != renter_user:
            raise BookingPermissionError("Only booking participants can initiate item return.")

        if booking.status != Booking.STATUS_ACTIVE:
            raise InvalidStateTransitionError(
                f"Cannot initiate return for booking in status '{booking.status}'.",
                current_status=booking.status,
                attempted_action="INITIATE_RETURN"
            )

        previous_status = booking.status
        booking.status = Booking.STATUS_RETURNED_PENDING_INSPECTION
        booking.returned_at = timezone.now()
        booking.return_notes = return_notes
        booking.save()

        cls.record_transition(
            booking=booking,
            previous_status=previous_status,
            new_status=booking.status,
            changed_by=renter_user,
            reason="Item physically returned on campus. Inspection pending by owner.",
            metadata={"return_notes": return_notes}
        )

        # Notify Owner
        send_notification(
            recipient=booking.owner,
            actor=renter_user,
            event_type="RETURN_INITIATED",
            title="Item Returned — Inspection Required",
            message=f"{booking.renter.first_name} returned {booking.item_title}. Please inspect the equipment to release the deposit.",
            booking=booking
        )

        return booking

    @classmethod
    @transaction.atomic
    def complete_inspection(cls, booking_id: str, owner_user, passed: bool = True, notes: str = "") -> Booking:
        """Owner inspects returned item. If passed -> COMPLETED, if failed -> DISPUTED."""
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if booking.owner != owner_user:
            raise BookingPermissionError("Only the item owner can complete the return inspection.")

        if booking.status != Booking.STATUS_RETURNED_PENDING_INSPECTION:
            raise InvalidStateTransitionError(
                f"Cannot inspect booking in status '{booking.status}'.",
                current_status=booking.status,
                attempted_action="COMPLETE_INSPECTION"
            )

        previous_status = booking.status

        if passed:
            booking.status = Booking.STATUS_COMPLETED
            booking.completed_at = timezone.now()
            booking.save()

            # Increment rental count on item
            booking.item.rental_count += 1
            booking.item.save(update_fields=['rental_count', 'updated_at'])

            cls.record_transition(
                booking=booking,
                previous_status=previous_status,
                new_status=booking.status,
                changed_by=owner_user,
                reason="Inspection passed. Full security deposit released.",
                metadata={"notes": notes}
            )

            # Notify both
            send_notification(
                recipient=booking.renter,
                actor=owner_user,
                event_type="BOOKING_COMPLETED",
                title="Rental Completed — Deposit Released!",
                message=f"Owner verified {booking.item_title} in good condition. Your deposit of ₹{booking.security_deposit} has been released.",
                booking=booking
            )
            send_notification(
                recipient=booking.owner,
                actor=owner_user,
                event_type="BOOKING_COMPLETED",
                title="Rental Closed",
                message=f"You successfully completed the rental for {booking.item_title}. Earnings added to ledger.",
                booking=booking
            )
        else:
            booking.status = Booking.STATUS_DISPUTED
            booking.save()

            cls.record_transition(
                booking=booking,
                previous_status=previous_status,
                new_status=booking.status,
                changed_by=owner_user,
                reason=f"Inspection failed. Dispute opened: {notes}",
                metadata={"dispute_notes": notes}
            )

            send_notification(
                recipient=booking.renter,
                actor=owner_user,
                event_type="DISPUTE_RAISED",
                title="Dispute Opened on Rental",
                message=f"Owner reported an issue with {booking.item_title}: {notes}",
                booking=booking
            )

        return booking

    @classmethod
    @transaction.atomic
    def raise_dispute(cls, booking_id: str, user, reason: str) -> Booking:
        """Student or owner opens dispute during active rental or inspection."""
        booking = Booking.objects.select_for_update(of=('self',)).get(id=booking_id)

        if user not in (booking.owner, booking.renter):
            raise BookingPermissionError("Only booking participants can report a dispute.")

        allowed_states = [Booking.STATUS_ACTIVE, Booking.STATUS_RETURNED_PENDING_INSPECTION]
        if booking.status not in allowed_states:
            raise InvalidStateTransitionError(
                f"Cannot raise dispute on booking in status '{booking.status}'.",
                current_status=booking.status,
                attempted_action="DISPUTE"
            )

        previous_status = booking.status
        booking.status = Booking.STATUS_DISPUTED
        booking.save()

        cls.record_transition(
            booking=booking,
            previous_status=previous_status,
            new_status=booking.status,
            changed_by=user,
            reason=f"Dispute raised: {reason}",
            metadata={"reason": reason}
        )

        other_user = booking.owner if user == booking.renter else booking.renter
        send_notification(
            recipient=other_user,
            actor=user,
            event_type="DISPUTE_RAISED",
            title="Rental Dispute Raised",
            message=f"An issue was reported on {booking.item_title}: {reason}",
            booking=booking
        )

        return booking


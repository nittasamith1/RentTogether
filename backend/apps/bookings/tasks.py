from datetime import date
from django.utils import timezone
from apps.bookings.models import Booking, HandoverVerification, HandoverVerificationEvent
from apps.bookings.services.booking_state_machine import BookingStateMachine
from apps.notifications.services import send_notification


def expire_pending_approval_requests() -> int:
    """
    Finds and cancels booking requests whose 24-hour owner approval deadline has elapsed.
    """
    now = timezone.now()
    expired_bookings = Booking.objects.filter(
        status=Booking.STATUS_PENDING_APPROVAL,
        approval_deadline__isnull=False,
        approval_deadline__lte=now
    )
    count = 0
    for booking in expired_bookings:
        try:
            BookingStateMachine.cancel_booking(
                str(booking.id),
                user=None,
                reason="Owner approval window (24 hours) expired without response."
            )
            count += 1
        except Exception:
            pass
    return count


def expire_payment_requests() -> int:
    """
    Finds and cancels approved bookings whose 12-hour payment window has elapsed.
    Releases Phase 06 availability blocks so dates become available again.
    """
    now = timezone.now()
    unpaid_bookings = Booking.objects.filter(
        status=Booking.STATUS_APPROVED_PENDING_PAYMENT,
        payment_deadline__isnull=False,
        payment_deadline__lte=now
    )
    count = 0
    for booking in unpaid_bookings:
        try:
            BookingStateMachine.cancel_booking(
                str(booking.id),
                user=None,
                reason="Payment deadline (12 hours) expired. Reserved dates released."
            )
            count += 1
        except Exception:
            pass
    return count


def expire_handover_passes() -> int:
    """
    Invalidates expired pickup and return credentials across HandoverVerification records.
    """
    now = timezone.now()

    expired_pickups = HandoverVerification.objects.filter(
        pickup_verified=False,
        pickup_token_expires_at__lte=now,
        pickup_otp_hash__gt=""
    )
    count = 0
    for v in expired_pickups:
        v.pickup_otp_hash = ""
        v.pickup_qr_token_hash = ""
        v.save(update_fields=['pickup_otp_hash', 'pickup_qr_token_hash', 'updated_at'])
        HandoverVerificationEvent.objects.create(
            booking=v.booking,
            event_type='TOKEN_EXPIRED',
            performed_by=None,
            verification_method='SYSTEM',
            success=False,
            failure_reason="Pickup pass expired automatically."
        )
        count += 1

    expired_returns = HandoverVerification.objects.filter(
        return_verified=False,
        return_token_expires_at__lte=now,
        return_otp_hash__gt=""
    )
    for v in expired_returns:
        v.return_otp_hash = ""
        v.return_qr_token_hash = ""
        v.save(update_fields=['return_otp_hash', 'return_qr_token_hash', 'updated_at'])
        HandoverVerificationEvent.objects.create(
            booking=v.booking,
            event_type='TOKEN_EXPIRED',
            performed_by=None,
            verification_method='SYSTEM',
            success=False,
            failure_reason="Return pass expired automatically."
        )
        count += 1

    return count


def send_pickup_reminders() -> int:
    """
    Notifies both participants about upcoming scheduled item handover.
    """
    today = date.today()
    bookings = Booking.objects.filter(
        status=Booking.STATUS_PAID_CONFIRMED,
        start_date=today
    )
    count = 0
    for b in bookings:
        send_notification(
            recipient=b.renter,
            event_type='PICKUP_REMINDER',
            title='Equipment Pickup Today!',
            message=f"Meet {b.owner.first_name} at {b.pickup_spot} to receive {b.item_title}.",
            booking=b
        )
        send_notification(
            recipient=b.owner,
            event_type='PICKUP_REMINDER',
            title='Equipment Handover Today!',
            message=f"Meet {b.renter.first_name} at {b.pickup_spot} to hand over {b.item_title}. Open your pickup pass.",
            booking=b
        )
        count += 1
    return count


def send_return_reminders() -> int:
    """
    Notifies renter 1 day before the expected return date.
    """
    tomorrow = date.today() + timezone.timedelta(days=1)
    bookings = Booking.objects.filter(
        status=Booking.STATUS_ACTIVE,
        end_date=tomorrow
    )
    count = 0
    for b in bookings:
        send_notification(
            recipient=b.renter,
            event_type='RETURN_REMINDER',
            title='Rental Return Due Tomorrow',
            message=f"Your rental of {b.item_title} is due for handback tomorrow at {b.pickup_spot}.",
            booking=b
        )
        count += 1
    return count

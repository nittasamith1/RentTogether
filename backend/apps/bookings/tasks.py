import logging
from datetime import date, timedelta
from django.utils import timezone

try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(func):
            func.delay = func
            func.apply_async = lambda *a, **k: func(*a, **k)
            return func
        if args and callable(args[0]):
            return decorator(args[0])
        return decorator

from apps.bookings.models import Booking, BookingStatusHistory, HandoverVerification, HandoverVerificationEvent
from apps.bookings.services.booking_state_machine import BookingStateMachine
from apps.notifications.services import send_notification
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


@shared_task(name="apps.bookings.tasks.check_unanswered_booking_requests")
def check_unanswered_booking_requests() -> int:
    """
    Auto-cancels booking requests pending for more than 24 hours without owner response.
    Notifies both renter and owner.
    """
    cutoff = timezone.now() - timedelta(hours=24)
    # Check either approval_deadline passed or created_at older than 24 hours
    unanswered_bookings = Booking.objects.filter(
        status=Booking.STATUS_PENDING_APPROVAL,
        created_at__lte=cutoff
    )
    count = 0
    for booking in unanswered_bookings:
        try:
            BookingStateMachine.cancel_booking(
                str(booking.id),
                user=None,
                reason="Owner approval window (24 hours) expired without response."
            )
            send_notification(
                recipient=booking.renter,
                event_type="BOOKING_EXPIRED",
                title="Booking Request Expired",
                message=f"Your rental request for {booking.item_title} expired as the owner did not respond within 24 hours.",
                booking=booking
            )
            send_notification(
                recipient=booking.owner,
                event_type="BOOKING_EXPIRED",
                title="Rental Request Auto-Cancelled",
                message=f"The rental request for {booking.item_title} by {booking.renter.first_name} was auto-cancelled after 24 hours.",
                booking=booking
            )
            count += 1
        except Exception as e:
            logger.warning("Error auto-cancelling unanswered booking %s: %s", booking.id, e)
    return count


@shared_task(name="apps.bookings.tasks.send_return_due_reminders")
def send_return_due_reminders() -> int:
    """
    Runs hourly. Alerts renter 24 hours and 2 hours before scheduled return.
    """
    now = timezone.now()
    active_bookings = Booking.objects.filter(status=Booking.STATUS_ACTIVE)
    count = 0

    for b in active_bookings:
        # Determine exact scheduled return datetime
        if b.end_datetime:
            return_time = b.end_datetime
        else:
            return_time = timezone.make_aware(
                timezone.datetime.combine(b.end_date, timezone.datetime.min.time().replace(hour=18))
            )

        time_until_return = return_time - now
        hours_left = time_until_return.total_seconds() / 3600.0

        # 24-Hour Reminder (between 23 and 25 hours remaining)
        already_sent_24h = Notification.objects.filter(booking=b, event_type='RETURN_REMINDER_24H').exists()
        if 23.0 <= hours_left <= 25.0 and not already_sent_24h:
            send_notification(
                recipient=b.renter,
                event_type='RETURN_REMINDER_24H',
                title='Rental Return Due in 24 Hours',
                message=f"Friendly reminder: {b.item_title} is due for return tomorrow at {b.pickup_spot}. Please inspect and pack all companion cables/accessories.",
                booking=b,
                send_email_copy=True
            )
            count += 1

        # 2-Hour Urgent Reminder (between 1 and 2.5 hours remaining)
        already_sent_2h = Notification.objects.filter(booking=b, event_type='RETURN_REMINDER_2H').exists()
        if 1.0 <= hours_left <= 2.5 and not already_sent_2h:
            send_notification(
                recipient=b.renter,
                event_type='RETURN_REMINDER_2H',
                title='Urgent: Rental Return Due in 2 Hours',
                message=f"Heads up! {b.item_title} is scheduled for return in ~2 hours at {b.pickup_spot}. Open your return pass to generate the handover code.",
                booking=b,
                send_email_copy=True
            )
            count += 1

    return count


@shared_task(name="apps.bookings.tasks.mark_overdue_bookings")
def mark_overdue_bookings() -> int:
    """
    Runs every 2 hours. Flags rentals past their scheduled return date/time
    as OVERDUE and sends urgent alerts to both parties.
    """
    now = timezone.now()
    active_bookings = Booking.objects.filter(status=Booking.STATUS_ACTIVE)
    count = 0

    for b in active_bookings:
        if b.end_datetime:
            return_time = b.end_datetime
        else:
            return_time = timezone.make_aware(
                timezone.datetime.combine(b.end_date, timezone.datetime.min.time().replace(hour=23, minute=59))
            )

        if now > return_time:
            b.status = Booking.STATUS_OVERDUE
            b.save(update_fields=['status', 'updated_at'])
            BookingStatusHistory.objects.create(
                booking=b,
                previous_status=Booking.STATUS_ACTIVE,
                new_status=Booking.STATUS_OVERDUE,
                reason='Automated: Rental elapsed scheduled return window without handback inspection.'
            )

            # Alert Renter
            send_notification(
                recipient=b.renter,
                event_type='RENTAL_OVERDUE',
                title='Equipment Return Overdue!',
                message=f"Your rental of {b.item_title} is now overdue. Please contact owner {b.owner.first_name} immediately to complete return inspection and avoid dispute penalties.",
                booking=b,
                send_email_copy=True
            )

            # Alert Owner
            send_notification(
                recipient=b.owner,
                event_type='RENTAL_OVERDUE',
                title='Rented Item Overdue for Return',
                message=f"{b.renter.first_name} has not completed return for {b.item_title}. If unreturned, you can raise an on-ground dispute from your dashboard.",
                booking=b,
                send_email_copy=True
            )
            count += 1

    return count


@shared_task(name="apps.bookings.tasks.expire_payment_requests")
def expire_payment_requests() -> int:
    """
    Finds and cancels approved bookings whose 12-hour payment window has elapsed.
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

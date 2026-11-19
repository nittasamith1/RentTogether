import logging
from django.core.mail import send_mail
from django.conf import settings
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


def send_notification(
    recipient,
    event_type: str,
    title: str,
    message: str,
    booking=None,
    actor=None,
    metadata=None,
    link_url: str = '',
    send_email_copy: bool = True
):
    """
    Creates an in-app student notification record idempotently, and optionally
    dispatches an email reminder copy.
    """
    if not recipient:
        return None

    notif = Notification.objects.create(
        recipient=recipient,
        actor=actor,
        event_type=event_type,
        title=title,
        message=message,
        booking=booking,
        link_url=(link_url or (f"/bookings/{booking.id}" if booking else "")) or "",
        metadata=metadata or {}
    )

    if send_email_copy and getattr(recipient, 'email', None):
        try:
            send_mail(
                subject=f"[RentTogether] {title}",
                message=f"{message}\n\nView details: {link_url or 'https://renttogether.vercel.app'}",
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@renttogether.campus'),
                recipient_list=[recipient.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning("Failed to send email notification copy to %s: %s", recipient.email, e)

    return notif


from apps.notifications.models import Notification


def send_notification(recipient, event_type: str, title: str, message: str, booking=None, actor=None, metadata=None):
    """
    Creates an in-app student notification record idempotently.
    """
    if not recipient:
        return None

    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        event_type=event_type,
        title=title,
        message=message,
        booking=booking,
        metadata=metadata or {}
    )


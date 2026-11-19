import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    """
    In-app notifications for campus students regarding booking requests,
    approvals, payments, handovers, returns, and reviews.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_notifications'
    )
    event_type = models.CharField(max_length=60, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    metadata = models.JSONField(default=dict, blank=True)
    link_url = models.CharField(max_length=255, blank=True, null=True, default='')
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.link_url is None:
            self.link_url = f"/bookings/{self.booking_id}" if self.booking_id else ""
        super().save(*args, **kwargs)

    @property
    def user(self):
        return self.recipient

    @user.setter
    def user(self, value):
        self.recipient = value

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['recipient', 'is_read'], name='idx_notif_recipient_read'),
            models.Index(fields=['recipient', '-created_at'], name='idx_notif_recipient_date'),
        ]

    def __str__(self):
        return f"[{self.event_type}] {self.recipient.email}: {self.title}"


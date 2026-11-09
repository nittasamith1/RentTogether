import uuid
from django.db import models
from django.db.models import Q, F, CheckConstraint, Index
from django.core.exceptions import ValidationError
from django.utils import timezone


class ItemAvailabilityBlock(models.Model):
    """
    Represents a period when an item cannot be rented.
    Enforces a strict half-open date interval [start_date, end_date):
      - start_date is inclusive (first unavailable date)
      - end_date is exclusive (checkout / next rental start date)
    """
    REASON_BOOKED = 'BOOKED'
    REASON_OWNER_UNAVAILABLE = 'OWNER_UNAVAILABLE'
    REASON_MAINTENANCE = 'MAINTENANCE'

    REASON_CHOICES = [
        (REASON_BOOKED, 'Reserved for Rental Booking'),
        (REASON_OWNER_UNAVAILABLE, 'Owner Manually Blocked Dates'),
        (REASON_MAINTENANCE, 'Item Under Maintenance'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(
        'listings.Item',
        on_delete=models.CASCADE,
        related_name='availability_blocks',
        help_text="Associated marketplace resource item"
    )
    start_date = models.DateField(
        help_text="First unavailable date (inclusive boundary [start_date, end_date))",
        db_index=True
    )
    end_date = models.DateField(
        help_text="Exclusive ending date (next checkout/pickup can start on this day)",
        db_index=True
    )
    start_datetime = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Start timestamp of unavailable block (inclusive)"
    )
    end_datetime = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="End timestamp of unavailable block (exclusive)"
    )
    reason = models.CharField(
        max_length=30,
        choices=REASON_CHOICES,
        default=REASON_OWNER_UNAVAILABLE,
        db_index=True
    )
    booking_reference = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='availability_blocks',
        help_text="Associated rental booking (required for BOOKED blocks, prohibited for manual blocks)"
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Expiration timestamp for temporary booking payment holds (None = confirmed/permanent block)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'availability_itemavailabilityblock'
        ordering = ['start_date', 'end_date']
        verbose_name = 'Item Availability Block'
        verbose_name_plural = 'Item Availability Blocks'
        constraints = [
            CheckConstraint(
                check=Q(start_date__lt=F('end_date')),
                name='check_avail_start_before_end'
            ),
        ]
        indexes = [
            Index(fields=['item', 'start_date', 'end_date'], name='idx_avail_item_dates'),
            Index(fields=['item', 'start_datetime', 'end_datetime'], name='idx_avail_item_dtimes'),
            Index(fields=['reason', 'expires_at'], name='idx_avail_reason_expires'),
        ]

    def clean(self):
        super().clean()

        from datetime import time, timedelta
        current_tz = timezone.get_current_timezone()
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError({
                    'end_datetime': 'End time must be strictly after start time (half-open [start_datetime, end_datetime)).'
                })
            local_start = timezone.localtime(self.start_datetime, current_tz) if timezone.is_aware(self.start_datetime) else self.start_datetime
            local_end = timezone.localtime(self.end_datetime, current_tz) if timezone.is_aware(self.end_datetime) else self.end_datetime
            self.start_date = local_start.date()
            if local_end.date() > self.start_date:
                self.end_date = local_end.date()
            else:
                self.end_date = self.start_date + timedelta(days=1)
        elif self.start_date and self.end_date:
            if self.start_date >= self.end_date:
                raise ValidationError({
                    'end_date': 'End date must be strictly after start date (half-open [start_date, end_date)).'
                })
            if not self.start_datetime:
                self.start_datetime = timezone.make_aware(timezone.datetime.combine(self.start_date, time(0, 0)), current_tz)
            if not self.end_datetime:
                self.end_datetime = timezone.make_aware(timezone.datetime.combine(self.end_date, time(0, 0)), current_tz)

        if self.reason == self.REASON_BOOKED and not self.booking_reference:
            raise ValidationError({
                'booking_reference': 'A booking reference is mandatory for BOOKED availability blocks.'
            })

        if self.reason in (self.REASON_OWNER_UNAVAILABLE, self.REASON_MAINTENANCE) and self.booking_reference:
            raise ValidationError({
                'booking_reference': 'Manual owner blocks must not reference a booking.'
            })

        if self.expires_at and self.reason != self.REASON_BOOKED:
            raise ValidationError({
                'expires_at': 'Only temporary booking holds may have an expiration timestamp.'
            })

        if self.booking_reference and hasattr(self.booking_reference, 'item_id') and self.booking_reference.item_id:
            if self.booking_reference.item_id != self.item_id:
                raise ValidationError({
                    'booking_reference': 'Booking item must match the availability block item.'
                })

        if self.item_id and hasattr(self.item, 'status') and self.item.status == 'REMOVED':
            raise ValidationError({
                'item': 'Cannot create availability blocks for a permanently removed item.'
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_active(self) -> bool:
        """A block is active if it has no expiration or has not expired yet."""
        if not self.expires_at:
            return True
        return self.expires_at > timezone.now()

    @property
    def duration_days(self) -> int:
        """Number of full rental days occupied by this block."""
        return (self.end_date - self.start_date).days

    def __str__(self):
        return f"{self.item.title} [{self.start_date} to {self.end_date}) ({self.reason})"


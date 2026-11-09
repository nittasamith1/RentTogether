import uuid
import secrets
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone


def generate_booking_code() -> str:
    """Generates unique, collision-safe human-readable reference e.g. RT-2026-9812"""
    year = timezone.now().year
    random_suffix = secrets.token_hex(2).upper()
    return f"RT-{year}-{random_suffix}"


class Booking(models.Model):
    """
    Authoritative record of an intra-campus rental agreement.
    Connects exactly one renter, one owner, and one item.
    Enforces half-open interval [start_date, end_date).
    """

    # Lifecycle State Constants
    STATUS_PENDING_APPROVAL = 'PENDING_APPROVAL'
    STATUS_APPROVED_PENDING_PAYMENT = 'APPROVED_PENDING_PAYMENT'
    STATUS_REJECTED = 'REJECTED'
    STATUS_PAID_CONFIRMED = 'PAID_CONFIRMED'
    STATUS_PENDING_APPROVAL = 'PENDING_APPROVAL'
    STATUS_APPROVED_PENDING_CASH_PAYMENT = 'APPROVED_PENDING_PAYMENT'
    STATUS_APPROVED_PENDING_PAYMENT = 'APPROVED_PENDING_PAYMENT'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CASH_PAYMENT_CONFIRMED = 'PAID_CONFIRMED'
    STATUS_PAID_CONFIRMED = 'PAID_CONFIRMED'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_RETURNED_PENDING_CONFIRMATION = 'RETURNED_PENDING_INSPECTION'
    STATUS_RETURNED_PENDING_INSPECTION = 'RETURNED_PENDING_INSPECTION'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_DISPUTED = 'DISPUTED'

    # Aliases for legacy code
    STATUS_APPROVED = STATUS_APPROVED_PENDING_PAYMENT
    STATUS_PENDING = STATUS_PENDING_APPROVAL

    STATUS_CHOICES = [
        (STATUS_PENDING_APPROVAL, 'Pending Owner Approval'),
        ('APPROVED_PENDING_CASH_PAYMENT', 'Approved, Pending Cash Payment'),
        (STATUS_APPROVED_PENDING_PAYMENT, 'Approved, Pending Cash Payment'),
        (STATUS_REJECTED, 'Request Rejected'),
        ('CASH_PAYMENT_CONFIRMED', 'Cash Payment Confirmed (Awaiting Handover)'),
        (STATUS_PAID_CONFIRMED, 'Cash Payment Confirmed (Awaiting Handover)'),
        (STATUS_ACTIVE, 'Active Rental'),
        ('RETURNED_PENDING_CONFIRMATION', 'Returned, Pending Confirmation'),
        (STATUS_RETURNED_PENDING_INSPECTION, 'Returned, Pending Confirmation'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_DISPUTED, 'Disputed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_code = models.CharField(max_length=30, unique=True, editable=False, db_index=True)
    booking_reference = models.CharField(max_length=30, unique=True, editable=False, db_index=True, null=True, blank=True)

    item = models.ForeignKey(
        'listings.Item',
        on_delete=models.PROTECT,
        related_name='bookings',
        null=True,
        blank=True,
        help_text="Listed equipment resource"
    )
    item_title = models.CharField(max_length=200, blank=True, default="Equipment Resource", help_text="Snapshot of the item title")

    renter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='renter_bookings',
        help_text="Student renting the item"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owner_bookings',
        help_text="Student lending the item"
    )

    # Rental Schedule [start_date, end_date) half-open
    start_date = models.DateField(help_text="First day of rental (inclusive)")
    end_date = models.DateField(help_text="Return day of rental (exclusive checkout boundary)")
    total_days = models.PositiveIntegerField(default=1, help_text="Duration in rental days")

    # Hourly Rental Support: [start_datetime, end_datetime) half-open
    start_datetime = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Start timestamp of rental (inclusive)"
    )
    end_datetime = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="End / Return timestamp of rental (exclusive checkout boundary)"
    )
    total_duration_hours = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('24.00'),
        help_text="Exact duration in hours (e.g. 1.5, 5.0, 24.0)"
    )

    # Financial breakdown & snapshots (Decimal precision)
    daily_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Snapshotted daily rental fee at time of request"
    )
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Calculated hourly rate (daily_rate / 24)"
    )
    total_rental_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total rental charges (total_days * daily_rate)"
    )
    security_deposit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Refundable security deposit held in escrow"
    )
    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Campus platform maintenance fee"
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total amount payable (rental_fee + deposit + platform_fee)"
    )
    reference_purchase_price_inr = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Estimated retail purchase price for calculating student savings vs buying new"
    )

    status = models.CharField(
        max_length=35,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING_APPROVAL,
        db_index=True
    )

    # V1 Exclusive Payment Mechanism: Dual Offline Cash Confirmation
    payment_method = models.CharField(
        max_length=25,
        default='OFFLINE_CASH',
        choices=[('OFFLINE_CASH', 'In-Person Offline Cash')],
        help_text="Exclusive payment mechanism for V1"
    )
    renter_cash_confirmed = models.BooleanField(
        default=False,
        help_text="True when renter confirms handing over cash directly to owner"
    )
    renter_cash_confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when renter confirmed physical cash payment"
    )
    owner_cash_confirmed = models.BooleanField(
        default=False,
        help_text="True when owner confirms receiving exact cash amount from renter"
    )
    owner_cash_confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when owner confirmed receiving physical cash"
    )

    # Reasons
    rejection_reason = models.TextField(blank=True, default="", help_text="Owner explanation if rejected")
    cancellation_reason = models.TextField(blank=True, default="", help_text="Cancellation reason")

    # Handover verification
    handover_pass_code = models.CharField(max_length=12, blank=True, default="", help_text="Single-use handover verification code")
    handover_token = models.CharField(max_length=64, blank=True, default="", help_text="Cryptographic handover pass token")
    return_notes = models.TextField(blank=True, default="", help_text="Notes recorded during item return")
    pickup_spot = models.CharField(max_length=150, blank=True, default="Campus Handover Desk")

    # Deadlines & Lifecycle Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    approval_deadline = models.DateTimeField(null=True, blank=True, db_index=True, help_text="Owner 24-hr response window")
    approved_at = models.DateTimeField(null=True, blank=True)
    payment_deadline = models.DateTimeField(null=True, blank=True, db_index=True, help_text="Renter 12-hr payment window")
    paid_at = models.DateTimeField(null=True, blank=True)
    handover_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings_booking'
        ordering = ['-created_at']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        indexes = [
            models.Index(fields=['owner', 'status'], name='idx_booking_owner_status'),
            models.Index(fields=['renter', 'status'], name='idx_booking_renter_status'),
            models.Index(fields=['item', 'status'], name='idx_booking_item_status'),
            models.Index(fields=['start_date', 'end_date'], name='idx_booking_dates'),
            models.Index(fields=['start_datetime', 'end_datetime'], name='idx_booking_datetimes'),
        ]

    # Backward compatibility properties
    @property
    def daily_price(self):
        return self.daily_rate

    @daily_price.setter
    def daily_price(self, value):
        self.daily_rate = value

    @property
    def rental_price_inr(self):
        return self.total_rental_fee

    @rental_price_inr.setter
    def rental_price_inr(self, value):
        self.total_rental_fee = value

    @property
    def deposit_amount_inr(self):
        return self.security_deposit

    @deposit_amount_inr.setter
    def deposit_amount_inr(self, value):
        self.security_deposit = value


    def clean(self):
        super().clean()
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError({
                    'end_datetime': 'End time must be strictly after start time (half-open [start_datetime, end_datetime)).'
                })
        elif self.start_date and self.end_date:
            if self.start_date >= self.end_date:
                raise ValidationError({
                    'end_date': 'End date must be strictly after start date (half-open [start_date, end_date)).'
                })
        if self.renter_id and self.owner_id and self.renter_id == self.owner_id:
            raise ValidationError({
                'renter': 'A student cannot book their own listed equipment.'
            })

    def save(self, *args, **kwargs):
        if not self.booking_code:
            code = generate_booking_code()
            while Booking.objects.filter(booking_code=code).exists():
                code = generate_booking_code()
            self.booking_code = code

        if not self.booking_reference:
            self.booking_reference = self.booking_code

        if not self.handover_pass_code:
            self.handover_pass_code = f"HP-{secrets.token_hex(3).upper()}"

        if not self.handover_token:
            self.handover_token = secrets.token_urlsafe(24)

        from datetime import time, timedelta
        current_tz = timezone.get_current_timezone()
        if self.start_datetime and self.end_datetime:
            local_start = timezone.localtime(self.start_datetime, current_tz) if timezone.is_aware(self.start_datetime) else self.start_datetime
            local_end = timezone.localtime(self.end_datetime, current_tz) if timezone.is_aware(self.end_datetime) else self.end_datetime
            self.start_date = local_start.date()
            if local_end.date() > self.start_date:
                self.end_date = local_end.date()
            else:
                self.end_date = self.start_date + timedelta(days=1)
            seconds = (self.end_datetime - self.start_datetime).total_seconds()
            hours = Decimal(str(round(seconds / 3600.0, 4)))
            self.total_duration_hours = hours.quantize(Decimal('0.01'))
            self.total_days = max(1, (self.end_date - self.start_date).days)
        elif self.start_date and self.end_date:
            if not self.start_datetime:
                self.start_datetime = timezone.make_aware(timezone.datetime.combine(self.start_date, time(0, 0)), current_tz)
            if not self.end_datetime:
                self.end_datetime = timezone.make_aware(timezone.datetime.combine(self.end_date, time(0, 0)), current_tz)
            self.total_days = max(1, (self.end_date - self.start_date).days)
            self.total_duration_hours = Decimal(str(self.total_days * 24)).quantize(Decimal('0.01'))

        if self.daily_rate:
            self.hourly_rate = (self.daily_rate / Decimal('24')).quantize(Decimal('0.01'))
            if self.total_duration_hours and not self.total_rental_fee:
                self.total_rental_fee = (self.hourly_rate * self.total_duration_hours).quantize(Decimal('0.01'))
                self.total_amount = self.total_rental_fee

        if not self.item_title:
            self.item_title = self.item.title if self.item else "Equipment Resource"

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_code}: {self.item_title} ({self.owner.email} -> {self.renter.email}) [{self.status}]"


class BookingStatusHistory(models.Model):
    """
    Immutable audit history of booking lifecycle transitions.
    Provides complete traceability of who changed what, when, and why.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    previous_status = models.CharField(max_length=35, null=True, blank=True)
    new_status = models.CharField(max_length=35)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='booking_status_changes'
    )
    reason = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings_statushistory'
        ordering = ['created_at']
        verbose_name = 'Booking Status History'
        verbose_name_plural = 'Booking Status Histories'

    def __str__(self):
        actor = self.changed_by.email if self.changed_by else "System"
        return f"{self.booking.booking_code}: {self.previous_status} -> {self.new_status} by {actor}"


# ==============================================================================
# PHASE 08: IN-PERSON CAMPUS HANDOVER, RETURN VERIFICATION & QR CODES
# ==============================================================================

PICKUP_CONDITION_CHOICES = [
    ('NEW', 'Brand New'),
    ('LIKE_NEW', 'Like New'),
    ('GOOD', 'Good Condition'),
    ('FAIR', 'Fair / Observable Wear'),
]

RETURN_CONDITION_CHOICES = [
    ('SAME', 'Same as Handover'),
    ('MINOR_WEAR', 'Minor Wear & Tear'),
    ('DAMAGED', 'Noticeable Physical Damage'),
    ('MISSING_ACCESSORIES', 'Missing Parts / Accessories'),
]

HANDOVER_EVENT_CHOICES = [
    ('PICKUP_TOKEN_GENERATED', 'Pickup Token Generated'),
    ('PICKUP_OTP_GENERATED', 'Pickup OTP Generated'),
    ('PICKUP_VERIFICATION_ATTEMPT', 'Pickup Verification Attempt'),
    ('PICKUP_VERIFIED', 'Pickup Verified Successfully'),
    ('RETURN_TOKEN_GENERATED', 'Return Token Generated'),
    ('RETURN_OTP_GENERATED', 'Return OTP Generated'),
    ('RETURN_VERIFICATION_ATTEMPT', 'Return Verification Attempt'),
    ('RETURN_VERIFIED', 'Return Verified Successfully'),
    ('TOKEN_EXPIRED', 'Token Expired'),
    ('TOKEN_REVOKED', 'Token Revoked / Regenerated'),
    ('VERIFICATION_FAILED', 'Verification Failed'),
]


class HandoverVerification(models.Model):
    """
    Authoritative state for physical exchange verification between students on campus.
    Stores only cryptographically hashed credentials (never plaintext secrets).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='handover_verification'
    )

    # Pickup credentials & verification (Owner displays, Renter verifies)
    pickup_otp_hash = models.CharField(max_length=128, blank=True, default="")
    pickup_qr_token_hash = models.CharField(max_length=128, blank=True, default="")
    pickup_token_expires_at = models.DateTimeField(null=True, blank=True)
    pickup_confirmed_at = models.DateTimeField(null=True, blank=True)
    pickup_confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pickups_confirmed'
    )
    pickup_notes = models.TextField(blank=True, default="")
    pickup_condition = models.CharField(
        max_length=25,
        choices=PICKUP_CONDITION_CHOICES,
        default='GOOD'
    )
    pickup_verified = models.BooleanField(default=False)
    pickup_attempt_count = models.PositiveSmallIntegerField(default=0)
    pickup_token_used_at = models.DateTimeField(null=True, blank=True)

    # Return credentials & verification (Renter displays, Owner verifies)
    return_otp_hash = models.CharField(max_length=128, blank=True, default="")
    return_qr_token_hash = models.CharField(max_length=128, blank=True, default="")
    return_token_expires_at = models.DateTimeField(null=True, blank=True)
    return_confirmed_at = models.DateTimeField(null=True, blank=True)
    return_confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='returns_confirmed'
    )
    return_item_condition = models.CharField(
        max_length=25,
        choices=RETURN_CONDITION_CHOICES,
        default='SAME'
    )
    return_notes = models.TextField(blank=True, default="")
    return_verified = models.BooleanField(default=False)
    return_attempt_count = models.PositiveSmallIntegerField(default=0)
    return_token_used_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings_handoververification'
        verbose_name = 'Handover Verification'
        verbose_name_plural = 'Handover Verifications'

    def __str__(self):
        return f"HandoverVerification({self.booking.booking_code}) [Pickup: {self.pickup_verified}, Return: {self.return_verified}]"


class HandoverVerificationEvent(models.Model):
    """
    Immutable audit log tracking every handover token generation and verification attempt.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='handover_events'
    )
    event_type = models.CharField(max_length=40, choices=HANDOVER_EVENT_CHOICES)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handover_events_performed'
    )
    verification_method = models.CharField(
        max_length=15,
        choices=[('QR', 'QR Code'), ('OTP', 'OTP Passcode'), ('SYSTEM', 'Automated System')]
    )
    success = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=255, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings_handoververificationevent'
        ordering = ['created_at']
        verbose_name = 'Handover Verification Event'
        verbose_name_plural = 'Handover Verification Events'

    def __str__(self):
        status = "SUCCESS" if self.success else f"FAIL ({self.failure_reason})"
        return f"{self.booking.booking_code} - {self.event_type} via {self.verification_method} [{status}]"


class HandoverEvidence(models.Model):
    """
    Optional photographic evidence uploaded during campus pickup or return handback.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='handover_evidence'
    )
    evidence_stage = models.CharField(
        max_length=15,
        choices=[('PICKUP', 'Pickup Handover'), ('RETURN', 'Return Handback')]
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_handover_evidence'
    )
    image_url = models.CharField(max_length=500)
    caption = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings_handoverevidence'
        ordering = ['created_at']
        verbose_name = 'Handover Evidence'
        verbose_name_plural = 'Handover Evidence'

    def __str__(self):
        return f"{self.booking.booking_code} Evidence ({self.evidence_stage}) by {self.uploaded_by.email}"

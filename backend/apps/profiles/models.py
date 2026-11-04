import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.accounts.models import College


class StudentVerification(models.Model):
    """
    Student Identity Verification entity for institutional onboarding.
    Requires college ID card submission and admin review before granting full access.
    """
    STATUS_PENDING = 'PENDING'
    STATUS_VERIFIED = 'VERIFIED'
    STATUS_REJECTED = 'REJECTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Review'),
        (STATUS_VERIFIED, 'Verified'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    YEAR_CHOICES = [
        (1, '1st Year'),
        (2, '2nd Year'),
        (3, '3rd Year'),
        (4, '4th Year'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification"
    )
    college = models.ForeignKey(
        College,
        on_delete=models.PROTECT,
        related_name="verifications"
    )
    roll_number = models.CharField(
        max_length=50,
        help_text="Student institutional roll number (must be unique within the college)"
    )
    department = models.CharField(
        max_length=100,
        help_text="Department / Major (e.g., Computer Science, Electrical, Mechanical)"
    )
    year_of_study = models.PositiveSmallIntegerField(
        choices=YEAR_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        help_text="Year of study (1 to 4)"
    )
    id_card_image = models.ImageField(
        upload_to="id_cards/%Y/%m/",
        blank=True,
        null=True,
        help_text="Uploaded photo of institutional student ID card"
    )
    id_card_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        help_text="Cloudinary secure URL or asset reference"
    )
    verification_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True
    )
    rejection_reason = models.TextField(
        blank=True,
        default="",
        help_text="Detailed feedback provided by administrator upon rejection"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="verified_students"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']
        verbose_name = 'Student Verification'
        verbose_name_plural = 'Student Verifications'
        constraints = [
            models.UniqueConstraint(
                fields=['college', 'roll_number'],
                name='unique_college_roll_number'
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.roll_number} [{self.verification_status}]"

    def approve(self, admin_user):
        """
        Approve the student's verification, setting both the verification status
        and user flags so they can immediately access platform rentals.
        """
        self.verification_status = self.STATUS_VERIFIED
        self.verified_by = admin_user
        self.verified_at = timezone.now()
        self.rejection_reason = ""
        self.save(update_fields=['verification_status', 'verified_by', 'verified_at', 'rejection_reason', 'updated_at'])

        # Update associated User record
        user = self.user
        user.is_college_verified = True
        user.save(update_fields=['is_college_verified'])

        # Also mark StudentProfile is_verified
        if hasattr(user, 'profile'):
            profile = user.profile
            profile.is_verified = True
            profile.roll_number = self.roll_number
            profile.department = self.department
            profile.year_of_study = self.year_of_study
            profile.save(update_fields=['is_verified', 'roll_number', 'department', 'year_of_study'])

    def reject(self, admin_user, reason: str):
        """
        Reject the verification submission with an actionable reason for resubmission.
        """
        self.verification_status = self.STATUS_REJECTED
        self.verified_by = admin_user
        self.verified_at = timezone.now()
        self.rejection_reason = reason.strip() if reason else "ID card details could not be verified."
        self.save(update_fields=['verification_status', 'verified_by', 'verified_at', 'rejection_reason', 'updated_at'])

        user = self.user
        user.is_college_verified = False
        user.save(update_fields=['is_college_verified'])

        if hasattr(user, 'profile'):
            profile = user.profile
            profile.is_verified = False
            profile.save(update_fields=['is_verified'])


class StudentProfile(models.Model):
    """
    Unified Student Profile.
    Core Principle: One Student — One Account — Two Activities.
    Every verified student maintains one profile that holds both their lending (Owner)
    and borrowing (Renter) track record, savings, earnings, and trust scores.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    college = models.ForeignKey(
        College,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="student_profiles"
    )
    roll_number = models.CharField(max_length=50, blank=True, default="")
    department = models.CharField(max_length=100, blank=True, default="")
    year_of_study = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        choices=[(1, '1st Year'), (2, '2nd Year'), (3, '3rd Year'), (4, '4th Year')]
    )
    
    avatar = models.ImageField(upload_to="avatars/%Y/%m/", blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, default="")
    bio = models.TextField(max_length=500, blank=True, default="")
    phone_number = models.CharField(max_length=20, blank=True, default="")

    # Dual Reputation Scores (0.00 to 5.00)
    reputation_as_owner = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal('5.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('5.00'))]
    )
    reputation_as_renter = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal('5.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('5.00'))]
    )

    # Activity Metrics
    total_items_lent = models.PositiveIntegerField(default=0)
    total_items_borrowed = models.PositiveIntegerField(default=0)

    # Lifetime Financial Metrics (Decimal precision)
    total_savings_inr = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_earnings_inr = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )

    # Preferred campus meeting hubs
    preferred_pickup_spots = models.JSONField(default=list, blank=True)

    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'

    @property
    def total_savings(self):
        """Backward compatible property alias"""
        return self.total_savings_inr

    @property
    def total_earnings(self):
        """Backward compatible property alias"""
        return self.total_earnings_inr

    def __str__(self):
        return f"Profile: {self.user.email} [{self.college.code if self.college else 'No College'}]"


class StudentReview(models.Model):
    """
    Dedicated Student Review Model.
    Captures multi-criteria feedback for completed bookings.
    Supports separate evaluation criteria for Owners (Lenders) and Renters (Borrowers).
    """
    REVIEW_TYPE_OWNER = 'OWNER'
    REVIEW_TYPE_RENTER = 'RENTER'
    REVIEW_TYPE_CHOICES = [
        (REVIEW_TYPE_OWNER, 'Owner Review (Reviewing the Lender)'),
        (REVIEW_TYPE_RENTER, 'Renter Review (Reviewing the Borrower)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.PROTECT,
        related_name="student_reviews"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="given_reviews"
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_reviews"
    )
    review_type = models.CharField(max_length=10, choices=REVIEW_TYPE_CHOICES)

    # Owner Criteria (rated by Renter)
    condition_accuracy_score = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1 to 5 star rating: accuracy of item condition vs listing"
    )
    communication_score = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1 to 5 star rating: clarity, responsiveness, and friendliness"
    )
    punctuality_score = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1 to 5 star rating: on-time handover at meetup location"
    )

    # Renter Criteria (rated by Owner)
    on_time_return_score = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1 to 5 star rating: timely return without delays"
    )
    item_care_score = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1 to 5 star rating: returned clean and undamaged"
    )

    overall_comment = models.TextField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Student Review'
        verbose_name_plural = 'Student Reviews'
        constraints = [
            models.UniqueConstraint(
                fields=['booking', 'reviewer', 'review_type'],
                name='unique_booking_reviewer_type'
            ),
            models.CheckConstraint(
                check=~models.Q(reviewer=models.F('reviewee')),
                name='prevent_self_review'
            ),
        ]

    def clean(self):
        super().clean()
        if self.reviewer_id and self.reviewee_id and self.reviewer_id == self.reviewee_id:
            raise ValidationError("Students cannot submit a review for themselves.")

        if self.booking_id:
            booking = self.booking
            if booking.status != 'COMPLETED':
                raise ValidationError("Reviews can only be submitted for completed bookings.")

            participants = {booking.owner_id, booking.renter_id}
            if self.reviewer_id not in participants or self.reviewee_id not in participants:
                raise ValidationError("Only confirmed participants of this booking can submit a review.")

            if self.review_type == self.REVIEW_TYPE_OWNER:
                if self.reviewer_id != booking.renter_id or self.reviewee_id != booking.owner_id:
                    raise ValidationError("Owner reviews must be submitted by the renter reviewing the owner.")
                if not self.condition_accuracy_score:
                    raise ValidationError({"condition_accuracy_score": "Condition accuracy score is required for owner reviews."})
            elif self.review_type == self.REVIEW_TYPE_RENTER:
                if self.reviewer_id != booking.owner_id or self.reviewee_id != booking.renter_id:
                    raise ValidationError("Renter reviews must be submitted by the owner reviewing the renter.")
                if not self.on_time_return_score:
                    raise ValidationError({"on_time_return_score": "On-time return score is required for renter reviews."})
                if not self.item_care_score:
                    raise ValidationError({"item_care_score": "Item care score is required for renter reviews."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def calculated_score(self) -> Decimal:
        """
        Calculates normalized review score (1.00 to 5.00) based on weighted criteria.
        """
        if self.review_type == self.REVIEW_TYPE_OWNER:
            cond = Decimal(str(self.condition_accuracy_score or 5))
            comm_list = [s for s in [self.communication_score, self.punctuality_score] if s is not None]
            comm_punct = Decimal(str(sum(comm_list) / len(comm_list))) if comm_list else Decimal('5.00')
            return (cond * Decimal('0.70')) + (comm_punct * Decimal('0.30'))
        else:
            on_time = Decimal(str(self.on_time_return_score or 5))
            care = Decimal(str(self.item_care_score or 5))
            return (on_time * Decimal('0.60')) + (care * Decimal('0.40'))

    def __str__(self):
        return f"{self.review_type} review by {self.reviewer.email} -> {self.reviewee.email} ({self.calculated_score:.2f}★)"

import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
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

        # Keep user.is_college_verified False
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
    Every student maintains one profile that holds both their lending (Owner)
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
    avatar_url = models.URLField(max_length=500, blank=True, default="")
    bio = models.TextField(max_length=500, blank=True, default="")
    phone_number = models.CharField(max_length=20, blank=True, default="")
    
    # Dual Reputation Scores (1.00 to 5.00)
    reputation_as_owner = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    reputation_as_renter = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)

    # Lifetime Metrics
    total_savings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'

    def __str__(self):
        return f"Profile: {self.user.email} [{self.college.code if self.college else 'No College'}]"

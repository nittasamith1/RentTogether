import uuid
from django.db import models
from django.conf import settings
from apps.accounts.models import College

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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_profiles"
    )
    roll_number = models.CharField(max_length=50, blank=True, default="")
    department = models.CharField(max_length=100, blank=True, default="")
    year_of_study = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        choices=[(1, '1st Year'), (2, '2nd Year'), (3, '3rd Year'), (4, '4th Year'), (5, '5th Year')]
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

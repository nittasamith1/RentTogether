import uuid
import secrets
import string
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password


class College(models.Model):
    """
    College entity representing the institution tenant.
    For Version 1, configure only one active college (e.g. VNRVJIET).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Full college name")
    code = models.CharField(max_length=50, unique=True, help_text="Unique college short code, e.g. VNRVJIET")
    domain_whitelist = models.JSONField(
        default=list,
        help_text="List of permitted institutional email domains, e.g. ['vnrvjiet.in', 'vnrvjiet.ac.in']"
    )
    address = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'College'
        verbose_name_plural = 'Colleges'

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def domains_list(self):
        if isinstance(self.domain_whitelist, list):
            return [d.strip().lower() for d in self.domain_whitelist if isinstance(d, str) and d.strip()]
        if isinstance(self.domain_whitelist, str):
            return [d.strip().lower() for d in self.domain_whitelist.split(',') if d.strip()]
        return []

    def is_email_allowed(self, email: str) -> bool:
        if not email or '@' not in email:
            return False
        domain = email.split('@')[1].lower()
        return any(domain == d or domain.endswith('.' + d) for d in self.domains_list)


class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier for auth.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('email_verified', True)
        extra_fields.setdefault('is_college_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Unified Student User model.
    Every student has ONE account and ONE login.
    A student can both list items (Owner) and rent items (Renter).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name="Institutional Email Address")
    username = models.CharField(max_length=150, unique=False, blank=True, null=True, default="")
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    college = models.ForeignKey(
        College,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users"
    )
    email_verified = models.BooleanField(
        default=False,
        help_text="Designates whether the student has verified ownership of their institutional email."
    )
    is_college_verified = models.BooleanField(
        default=False,
        help_text="Designates whether the administrator has verified the student's college identity."
    )
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        full_name = self.get_full_name()
        return full_name if full_name else self.email

    @property
    def verification_status(self):
        """
        Calculates verification status based on StudentVerification record.
        """
        if hasattr(self, 'verification'):
            return self.verification.verification_status
        if self.is_college_verified:
            return 'VERIFIED'
        return 'NOT_SUBMITTED'


class EmailOTP(models.Model):
    """
    Cryptographically secure hashed OTP for student email verification.
    Valid for 5 minutes, max 5 attempts, with a 60-second cooldown for resend.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    otp_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    attempt_count = models.PositiveIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email OTP'
        verbose_name_plural = 'Email OTPs'

    def __str__(self):
        return f"OTP for {self.user.email} (expires {self.expires_at})"

    @classmethod
    def generate_otp_code(cls, length=6) -> str:
        """Generate a cryptographically secure 6-digit numeric OTP."""
        return "".join(secrets.choice(string.digits) for _ in range(length))

    @classmethod
    def create_for_user(cls, user: User) -> tuple['EmailOTP', str]:
        """
        Invalidates existing active OTPs for the user and generates a new one.
        Returns the EmailOTP record and the plain-text OTP (to be emailed once).
        """
        # Invalidate any previously active OTPs for this user
        cls.objects.filter(user=user, is_used=False).update(is_used=True)

        raw_otp = cls.generate_otp_code(6)
        hashed_otp = make_password(raw_otp)
        expires_at = timezone.now() + timedelta(minutes=5)

        otp_instance = cls.objects.create(
            user=user,
            otp_hash=hashed_otp,
            expires_at=expires_at,
            attempt_count=0,
            is_used=False
        )
        return otp_instance, raw_otp

    def verify(self, raw_otp: str) -> tuple[bool, str]:
        """
        Verifies the given raw OTP string against this OTP record.
        Enforces:
        - OTP not already used
        - Expiration (5 min)
        - Max attempt limit (5 attempts)
        - Constant-time password hash check
        """
        if self.is_used:
            return False, "This OTP has already been used. Please request a new one."

        if timezone.now() > self.expires_at:
            self.is_used = True
            self.save(update_fields=['is_used'])
            return False, "This OTP has expired. Please request a new one."

        if self.attempt_count >= 5:
            self.is_used = True
            self.save(update_fields=['is_used'])
            return False, "Maximum verification attempts exceeded. Please request a new OTP."

        # Increment attempt count
        self.attempt_count += 1
        
        if check_password(raw_otp.strip(), self.otp_hash):
            self.is_used = True
            self.save(update_fields=['attempt_count', 'is_used'])
            return True, "Verification successful."
        else:
            self.save(update_fields=['attempt_count'])
            remaining = 5 - self.attempt_count
            return False, f"Invalid OTP code. {remaining} attempt(s) remaining."

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class College(models.Model):
    """
    College entity representing the institution tenant.
    In Version 1, the platform operates as a single-college ecosystem.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Full college name")
    code = models.CharField(max_length=50, unique=True, help_text="Unique college short code, e.g. VNRVJIET")
    domain_whitelist = models.TextField(
        default="college.edu",
        help_text="Comma-separated institutional email domains, e.g. vnrvjiet.in, vnrvjiet.ac.in"
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
        return [d.strip().lower() for d in self.domain_whitelist.split(',') if d.strip()]

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
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
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
    email = models.EmailField(unique=True, verbose_name="College Email Address")
    college = models.ForeignKey(
        College,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )
    is_college_verified = models.BooleanField(
        default=False,
        help_text="Designates whether the student has verified institutional college identity."
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        full_name = self.get_full_name()
        return f"{full_name} ({self.email})" if full_name else self.email


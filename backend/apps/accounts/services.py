import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.exceptions import ValidationError
from apps.accounts.models import User, EmailOTP, College

logger = logging.getLogger(__name__)


def get_active_college() -> College:
    """
    Returns the single active college configured for Version 1.
    """
    college = College.objects.filter(is_active=True).first()
    if not college:
        raise ValidationError("No active college is currently configured on the platform.")
    return college


def validate_institutional_email(email: str, college: College = None) -> College:
    """
    Validates that the provided email belongs to the institutional domain whitelist
    of the active college.
    """
    if not college:
        college = get_active_college()

    if not college.is_email_allowed(email):
        allowed_domains = ", ".join(college.domains_list)
        raise ValidationError(
            f"The email address '{email}' is not from an approved institutional domain for {college.name}. "
            f"Accepted domains: {allowed_domains}"
        )
    return college


def send_verification_otp(user: User) -> EmailOTP:
    """
    Issues a cryptographically secure 6-digit OTP and emails it to the user.
    Enforces a 60-second cooldown period between successive OTP requests.
    """
    # Check 60-second cooldown
    latest_otp = EmailOTP.objects.filter(user=user).order_by('-created_at').first()
    if latest_otp and (timezone.now() - latest_otp.created_at) < timedelta(seconds=60):
        remaining_seconds = 60 - int((timezone.now() - latest_otp.created_at).total_seconds())
        raise ValidationError(
            f"Please wait {remaining_seconds} second(s) before requesting a new OTP."
        )

    # Invalidate old OTPs and create new one
    otp_record, raw_otp = EmailOTP.create_for_user(user)

    # Dispatch email
    subject = f"RentTogether — Your Verification Code: {raw_otp}"
    message = (
        f"Hello {user.first_name or 'Student'},\n\n"
        f"Your 6-digit RentTogether verification code is:\n\n"
        f"    {raw_otp}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"For your security, never share this code with anyone.\n\n"
        f"Best regards,\n"
        f"The RentTogether Team ({user.college.name if user.college else 'Campus Network'})"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@renttogether.edu'),
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to dispatch OTP email to {user.email}: {e}")
        # Note: Do NOT expose internal errors or OTP code
        raise ValidationError("Unable to send OTP email at this time. Please try again shortly.")

    return otp_record


def verify_email_otp(user: User, raw_otp: str) -> tuple[bool, str]:
    """
    Verifies an OTP code for a given student user.
    """
    latest_otp = EmailOTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
    if not latest_otp:
        return False, "No active OTP found. Please request a new verification code."

    success, message = latest_otp.verify(raw_otp)
    if success:
        user.email_verified = True
        user.save(update_fields=['email_verified'])

    return success, message

import os
from django.contrib.auth import authenticate
from django.core.validators import MinLengthValidator
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, College, EmailOTP
from apps.accounts.services import (
    get_active_college,
    validate_institutional_email,
    send_verification_otp,
    verify_email_otp,
)
from apps.profiles.models import StudentVerification, StudentProfile


class CollegeSerializer(serializers.ModelSerializer):
    """
    Serializer for College entity.
    """
    class Meta:
        model = College
        fields = ['id', 'name', 'code', 'domain_whitelist', 'address', 'is_active']
        read_only_fields = ['id', 'is_active']


class UserSummarySerializer(serializers.ModelSerializer):
    """
    Compact user representation returned with authentication tokens.
    """
    name = serializers.SerializerMethodField()
    verification_status = serializers.CharField(read_only=True)
    college_code = serializers.CharField(source='college.code', read_only=True, default='')
    college_name = serializers.CharField(source='college.name', read_only=True, default='')

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'name',
            'first_name',
            'last_name',
            'college_code',
            'college_name',
            'email_verified',
            'is_college_verified',
            'verification_status',
            'is_staff',
        ]

    def get_name(self, obj):
        full_name = obj.get_full_name()
        return full_name if full_name else obj.email.split('@')[0]


class StudentRegistrationSerializer(serializers.Serializer):
    """
    Stage 1: Student Registration Serializer.
    Validates institutional email domain, checks college roll number uniqueness,
    creates User and StudentVerification records, and triggers OTP email.
    """
    full_name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[MinLengthValidator(8)]
    )
    roll_number = serializers.CharField(max_length=50, required=True)
    department = serializers.CharField(max_length=100, required=True)
    year_of_study = serializers.IntegerField(min_value=1, max_value=4, required=True)
    id_card_image = serializers.ImageField(required=False, allow_null=True)

    def validate_email(self, value):
        email = value.strip().lower()
        college = get_active_college()
        validate_institutional_email(email, college)

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this institutional email already exists.")
        return email

    def validate_roll_number(self, value):
        roll_number = value.strip().upper()
        college = get_active_college()
        if StudentVerification.objects.filter(college=college, roll_number=roll_number).exists():
            raise serializers.ValidationError(
                f"The roll number '{roll_number}' is already registered for {college.code}."
            )
        return roll_number

    def create(self, validated_data):
        college = get_active_college()
        email = validated_data['email']
        password = validated_data['password']
        full_name = validated_data['full_name'].strip()
        roll_number = validated_data['roll_number']
        department = validated_data['department'].strip()
        year_of_study = validated_data['year_of_study']
        id_card_image = validated_data.get('id_card_image', None)

        # Parse first and last names
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # 1. Create User
        user = User.objects.create_user(
            email=email,
            username=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            college=college,
            email_verified=False,
            is_college_verified=False,
        )

        # 2. Upload ID card to Cloudinary or save locally
        id_card_url = ""
        if id_card_image:
            try:
                import cloudinary.uploader
                if os.getenv('CLOUDINARY_CLOUD_NAME'):
                    upload_result = cloudinary.uploader.upload(
                        id_card_image,
                        folder=f"renttogether/{college.code.lower()}/id_cards",
                        resource_type="image"
                    )
                    id_card_url = upload_result.get('secure_url', '')
            except Exception:
                pass  # Fall back to file field storage

        # 3. Create StudentVerification
        StudentVerification.objects.create(
            user=user,
            college=college,
            roll_number=roll_number,
            department=department,
            year_of_study=year_of_study,
            id_card_image=id_card_image,
            id_card_url=id_card_url,
            verification_status=StudentVerification.STATUS_PENDING
        )

        # 4. Create StudentProfile
        StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                'college': college,
                'roll_number': roll_number,
                'department': department,
                'year_of_study': year_of_study,
                'is_verified': False
            }
        )

        # 5. Send Email OTP
        send_verification_otp(user)

        return user


class VerifyEmailOTPSerializer(serializers.Serializer):
    """
    Stage 2: Email Verification Serializer.
    Validates the 6-digit OTP and generates JWT tokens upon success.
    """
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        otp = attrs.get('otp', '').strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "No account found with this email address."})

        success, message = verify_email_otp(user, otp)
        if not success:
            raise serializers.ValidationError({"otp": message})

        attrs['user'] = user
        return attrs


class ResendOTPSerializer(serializers.Serializer):
    """
    Resend verification OTP with 60-second cooldown enforcement.
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        email = value.strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email address.")
        if user.email_verified:
            raise serializers.ValidationError("This email address has already been verified.")
        return email


class LoginSerializer(serializers.Serializer):
    """
    Unified Student & Admin Login Serializer.
    Checks credentials and ensures institutional verification before issuing tokens.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        user = authenticate(username=email, password=password)
        if not user:
            # Fallback direct check if username != email
            try:
                candidate = User.objects.get(email=email)
                if candidate.check_password(password):
                    user = candidate
            except User.DoesNotExist:
                user = None

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated. Please contact campus admin.")

        # Check Email Verification
        if not user.email_verified and not (user.is_staff or user.is_superuser):
            raise serializers.ValidationError({
                "code": "EMAIL_NOT_VERIFIED",
                "detail": "Please verify your institutional email address before logging in.",
                "email": user.email
            })

        # Check College Identity Verification
        if not user.is_college_verified and not (user.is_staff or user.is_superuser):
            status = user.verification_status
            rejection_reason = getattr(getattr(user, 'verification', None), 'rejection_reason', '')
            raise serializers.ValidationError({
                "code": "COLLEGE_VERIFICATION_PENDING" if status == 'PENDING' else "COLLEGE_VERIFICATION_REJECTED",
                "detail": "Your student identity verification is pending administrator approval." if status == 'PENDING' else f"Verification rejected: {rejection_reason}",
                "verification_status": status,
                "rejection_reason": rejection_reason,
                "email": user.email
            })

        attrs['user'] = user
        return attrs


class LogoutSerializer(serializers.Serializer):
    """
    Blacklists the client's JWT refresh token upon sign-out.
    """
    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        token_str = attrs.get('refresh')
        try:
            token = RefreshToken(token_str)
            token.blacklist()
        except Exception:
            raise serializers.ValidationError({"refresh": "Invalid or expired token."})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Requests a password reset OTP for a verified student email.
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("No account found with this email address.")
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Confirms password reset using the 6-digit OTP.
    """
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[MinLengthValidator(8)]
    )

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        otp = attrs.get('otp', '').strip()
        new_password = attrs.get('new_password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User does not exist."})

        latest_otp = EmailOTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
        if not latest_otp:
            raise serializers.ValidationError({"otp": "No active reset code found. Please request a new one."})

        success, message = latest_otp.verify(otp)
        if not success:
            raise serializers.ValidationError({"otp": message})

        user.set_password(new_password)
        user.save()
        attrs['user'] = user
        return attrs


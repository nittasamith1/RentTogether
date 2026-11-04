from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import College, User
from apps.accounts.services import get_active_college, send_verification_otp
from apps.accounts.serializers import (
    CollegeSerializer,
    StudentRegistrationSerializer,
    VerifyEmailOTPSerializer,
    ResendOTPSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserSummarySerializer,
)


class ActiveCollegeView(views.APIView):
    """
    GET /api/v1/colleges/active/
    Returns the configured active college information and allowed email domains.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        college = get_active_college()
        serializer = CollegeSerializer(college)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RegisterView(views.APIView):
    """
    POST /api/v1/auth/register/
    Registers a new student, uploads their ID card, creates pending verification,
    and sends a 6-digit OTP to their institutional email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": (
                    f"Registration successful! A 6-digit verification code has been sent to {user.email}. "
                    "Please verify your email to continue."
                ),
                "email": user.email,
                "college": user.college.code if user.college else "",
            },
            status=status.HTTP_201_CREATED
        )


class VerifyEmailView(views.APIView):
    """
    POST /api/v1/auth/verify-email/
    Validates the 6-digit OTP sent to the student's institutional email.
    Marks email as verified and returns JWT tokens and verification status.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Issue tokens for initial post-registration onboarding flow
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Institutional email verified successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSummarySerializer(user).data
            },
            status=status.HTTP_200_OK
        )


class ResendOTPView(views.APIView):
    """
    POST /api/v1/auth/resend-otp/
    Resends a fresh 6-digit OTP with a 60-second cooldown protection.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)

        send_verification_otp(user)

        return Response(
            {"message": f"A new 6-digit verification code has been sent to {email}."},
            status=status.HTTP_200_OK
        )


class LoginView(views.APIView):
    """
    POST /api/v1/auth/login/
    Unified login for students and campus admins.
    Enforces email verification and college identity verification before issuing tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            if 'code' in errors:
                code_val = str(errors['code'][0]) if isinstance(errors['code'], list) else str(errors['code'])
                detail_val = str(errors['detail'][0]) if 'detail' in errors and isinstance(errors['detail'], list) else str(errors.get('detail', ''))
                status_val = str(errors['verification_status'][0]) if 'verification_status' in errors and isinstance(errors['verification_status'], list) else str(errors.get('verification_status', ''))
                reason_val = str(errors['rejection_reason'][0]) if 'rejection_reason' in errors and isinstance(errors['rejection_reason'], list) else str(errors.get('rejection_reason', ''))
                email_val = str(errors['email'][0]) if 'email' in errors and isinstance(errors['email'], list) else str(errors.get('email', ''))

                http_status = status.HTTP_403_FORBIDDEN if code_val in ['COLLEGE_VERIFICATION_PENDING', 'COLLEGE_VERIFICATION_REJECTED', 'EMAIL_NOT_VERIFIED'] else status.HTTP_400_BAD_REQUEST
                return Response(
                    {
                        "code": code_val,
                        "detail": detail_val,
                        "verification_status": status_val,
                        "rejection_reason": reason_val,
                        "email": email_val,
                    },
                    status=http_status
                )
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSummarySerializer(user).data
            },
            status=status.HTTP_200_OK
        )


class LogoutView(views.APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the provided refresh token so it cannot be used again.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK
        )


class PasswordResetRequestView(views.APIView):
    """
    POST /api/v1/auth/password-reset/
    Sends a 6-digit password reset OTP to verified student email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)

        send_verification_otp(user)

        return Response(
            {"message": f"A password reset code has been sent to {email}."},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(views.APIView):
    """
    POST /api/v1/auth/password-reset/confirm/
    Verifies OTP and resets student password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"message": "Password reset successfully. You may now log in with your new password."},
            status=status.HTTP_200_OK
        )

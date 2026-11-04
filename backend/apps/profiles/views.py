from rest_framework import status, views, permissions
from rest_framework.response import Response

from apps.accounts.models import User
from apps.profiles.models import StudentProfile, StudentVerification
from apps.profiles.serializers import (
    StudentProfileSerializer,
    StudentVerificationSerializer,
    StudentVerificationResubmitSerializer,
)


class StudentProfileMeView(views.APIView):
    """
    GET /api/v1/profiles/me/
    PATCH /api/v1/profiles/me/
    Retrieves or updates the authenticated student's profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(
            user=request.user,
            defaults={'college': request.user.college}
        )
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile, _ = StudentProfile.objects.get_or_create(
            user=request.user,
            defaults={'college': request.user.college}
        )
        # Students can update bio and phone_number
        for field in ['bio', 'phone_number']:
            if field in request.data:
                setattr(profile, field, request.data[field])
        profile.save()
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VerificationStatusView(views.APIView):
    """
    GET /api/v1/profiles/verification-status/
    Returns verification status and rejection details for the authenticated user
    or via email query parameter (e.g. during onboarding checks).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = None
        if request.user and request.user.is_authenticated:
            user = request.user
        else:
            email = request.query_params.get('email', '').strip().lower()
            if email:
                user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"detail": "Authentication credentials were not provided, or invalid email parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        verification = getattr(user, 'verification', None)
        if not verification:
            return Response(
                {
                    "email": user.email,
                    "verification_status": "NOT_SUBMITTED",
                    "detail": "No student verification application has been submitted yet."
                },
                status=status.HTTP_200_OK
            )

        serializer = StudentVerificationSerializer(verification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VerificationResubmitView(views.APIView):
    """
    POST /api/v1/profiles/verification/resubmit/
    Allows a student whose verification was REJECTED to submit updated details
    and a fresh ID card image for admin reconsideration.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StudentVerificationResubmitSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        updated_verification = serializer.save()

        return Response(
            {
                "message": "Verification application resubmitted successfully. It is now pending review.",
                "verification": StudentVerificationSerializer(updated_verification).data
            },
            status=status.HTTP_200_OK
        )

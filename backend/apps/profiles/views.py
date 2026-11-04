from rest_framework import status, views, permissions, generics
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from apps.accounts.models import User
from apps.profiles.models import StudentProfile, StudentVerification, StudentReview
from apps.profiles.serializers import (
    StudentProfileSerializer,
    StudentProfileUpdateSerializer,
    PublicStudentProfileSerializer,
    StudentReviewSerializer,
    StudentReviewCreateSerializer,
    StudentVerificationSerializer,
    StudentVerificationResubmitSerializer,
)
from apps.profiles.services.profile_stats_service import sync_profile_stats


class StandardReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class StudentProfileMeView(views.APIView):
    """
    GET /api/v1/profiles/me/
    PUT /api/v1/profiles/me/
    PATCH /api/v1/profiles/me/
    Retrieves or updates the authenticated student's full profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(
            user=request.user,
            defaults={'college': request.user.college}
        )
        # Authoritatively sync stats and reputation from bookings and reviews
        sync_profile_stats(request.user)
        profile.refresh_from_db()

        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=True):
        profile, _ = StudentProfile.objects.get_or_create(
            user=request.user,
            defaults={'college': request.user.college}
        )
        serializer = StudentProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=partial,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        updated_profile = serializer.save()

        # Return the complete student profile with fresh stats
        return Response(
            StudentProfileSerializer(updated_profile).data,
            status=status.HTTP_200_OK
        )


class PublicStudentProfileView(views.APIView):
    """
    GET /api/v1/profiles/<student_id>/
    Public profile for peer evaluation before booking.
    Strictly excludes sensitive student information (email, phone, roll number, id card image).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        target_user = get_object_or_404(User, id=student_id)
        profile, _ = StudentProfile.objects.get_or_create(
            user=target_user,
            defaults={'college': target_user.college}
        )
        serializer = PublicStudentProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentReviewCreateView(views.APIView):
    """
    POST /api/v1/profiles/reviews/
    Submits a review after booking completion.
    Recalculates reviewee reputation and profile stats immediately upon submission.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StudentReviewCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(
            StudentReviewSerializer(review).data,
            status=status.HTTP_201_CREATED
        )


class PublicReviewListView(generics.ListAPIView):
    """
    GET /api/v1/profiles/<student_id>/reviews/
    Lists reviews received by a student, with optional review_type filter ('OWNER' or 'RENTER').
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentReviewSerializer
    pagination_class = StandardReviewPagination

    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        target_user = get_object_or_404(User, id=student_id)
        qs = StudentReview.objects.filter(
            reviewee=target_user
        ).select_related('reviewer', 'reviewee', 'booking').order_by('-created_at')

        review_type = self.request.query_params.get('type') or self.request.query_params.get('review_type')
        if review_type:
            qs = qs.filter(review_type__iexact=review_type.strip().upper())

        return qs


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

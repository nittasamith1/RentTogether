from rest_framework import status, views, generics
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.accounts.permissions import IsAdminUser
from apps.profiles.models import StudentVerification
from apps.profiles.serializers import (
    StudentVerificationSerializer,
    VerificationRejectSerializer,
)


class AdminVerificationListView(generics.ListAPIView):
    """
    GET /api/v1/admin/verifications/
    Lists all student identity verification applications.
    Supports filtering by ?status=PENDING (default) or ?status=ALL.
    Restricted to Campus Administrators.
    """
    permission_classes = [IsAdminUser]
    serializer_class = StudentVerificationSerializer

    def get_queryset(self):
        status_param = self.request.query_params.get('status', 'PENDING').upper()
        queryset = StudentVerification.objects.select_related('user', 'college', 'verified_by').all()
        if status_param != 'ALL':
            queryset = queryset.filter(verification_status=status_param)
        return queryset.order_by('-submitted_at')


class AdminVerificationDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/admin/verifications/{id}/
    Retrieves full details of a single student verification submission,
    including student info, college ID photo, and current status.
    """
    permission_classes = [IsAdminUser]
    serializer_class = StudentVerificationSerializer
    queryset = StudentVerification.objects.select_related('user', 'college', 'verified_by').all()
    lookup_field = 'id'


class AdminVerificationApproveView(views.APIView):
    """
    POST /api/v1/admin/verifications/{id}/approve/
    Approves the student's identity, granting them verified access to the platform.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        verification = get_object_or_404(StudentVerification, id=id)
        verification.approve(admin_user=request.user)

        return Response(
            {
                "message": f"Student {verification.user.email} has been approved successfully.",
                "verification": StudentVerificationSerializer(verification).data
            },
            status=status.HTTP_200_OK
        )


class AdminVerificationRejectView(views.APIView):
    """
    POST /api/v1/admin/verifications/{id}/reject/
    Rejects the student's submission with a mandatory reason for feedback/resubmission.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        verification = get_object_or_404(StudentVerification, id=id)
        serializer = VerificationRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        verification.reject(admin_user=request.user, reason=reason)

        return Response(
            {
                "message": f"Student {verification.user.email} verification was rejected.",
                "verification": StudentVerificationSerializer(verification).data
            },
            status=status.HTTP_200_OK
        )

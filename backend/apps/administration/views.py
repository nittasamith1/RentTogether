from rest_framework import status, views, generics
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

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

        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            terms = search_query.split()
            search_q = Q()
            for term in terms:
                term_q = (
                    Q(user__first_name__icontains=term) |
                    Q(user__last_name__icontains=term) |
                    Q(user__email__icontains=term) |
                    Q(college_roll_number__icontains=term) |
                    Q(college_email__icontains=term) |
                    Q(department__icontains=term)
                )
                search_q &= term_q
            queryset = queryset.filter(search_q)

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

        from apps.notifications.services import send_notification
        send_notification(
            recipient=verification.user,
            actor=request.user,
            event_type="STUDENT_VERIFIED",
            title="Student Verification Approved!",
            message=f"Congratulations! Your student verification for {verification.college.name} has been approved. You now have full access to campus equipment rentals."
        )

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

        from apps.notifications.services import send_notification
        send_notification(
            recipient=verification.user,
            actor=request.user,
            event_type="STUDENT_VERIFICATION_REJECTED",
            title="Verification Application Declined",
            message=f"Your campus student verification could not be approved. Reason: {reason}",
            metadata={"reason": reason}
        )

        return Response(
            {
                "message": f"Student {verification.user.email} verification was rejected.",
                "verification": StudentVerificationSerializer(verification).data
            },
            status=status.HTTP_200_OK
        )


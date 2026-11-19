from decimal import Decimal
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count
from rest_framework import status, views, generics, permissions
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUser
from apps.accounts.models import User, College
from apps.profiles.models import StudentVerification
from apps.profiles.serializers import (
    StudentVerificationSerializer,
    VerificationRejectSerializer,
)
from apps.administration.models import Dispute
from apps.administration.serializers import (
    DisputeSerializer,
    CreateDisputeSerializer,
    ResolveDisputeSerializer,
    VerifyStudentActionSerializer,
)
from apps.bookings.models import Booking, BookingStatusHistory
from apps.listings.models import Item
from apps.notifications.services import send_notification


class AdminVerificationListView(generics.ListAPIView):
    """
    GET /api/v1/admin/verifications/ or GET /api/admin/pending-verifications/
    Lists student identity verification applications.
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
                    Q(roll_number__icontains=term) |
                    Q(department__icontains=term)
                )
                search_q &= term_q
            queryset = queryset.filter(search_q)

        return queryset.order_by('-submitted_at')


class AdminVerificationDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/admin/verifications/{id}/
    Retrieves full details of a single student verification submission.
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
    Rejects the student's submission with a mandatory reason.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        verification = get_object_or_404(StudentVerification, id=id)
        serializer = VerificationRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        verification.reject(admin_user=request.user, reason=reason)

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


class AdminVerifyStudentView(views.APIView):
    """
    POST /api/admin/verify-student/<id>/
    One-click student verification endpoint for the moderation queue.
    Accepts: { "action": "APPROVE" | "REJECT", "rejection_reason": "..." }
    """
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        serializer = VerifyStudentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']
        rejection_reason = serializer.validated_data.get('rejection_reason', '')

        # Lookup verification either by verification ID or user ID
        verification = StudentVerification.objects.filter(Q(id=id) | Q(user__id=id)).first()
        if not verification:
            return Response({"error": "Student verification record not found."}, status=status.HTTP_404_NOT_FOUND)

        if action == 'APPROVE':
            verification.approve(admin_user=request.user)
            send_notification(
                recipient=verification.user,
                actor=request.user,
                event_type="STUDENT_VERIFIED",
                title="Student Verification Approved!",
                message=f"Your student verification for {verification.college.name} was approved by campus administration.",
                link_url="/marketplace"
            )
            action_desc = "approved"
        else:
            reason = rejection_reason.strip() or "Identity documentation did not match institution roll sheet."
            verification.reject(admin_user=request.user, reason=reason)
            send_notification(
                recipient=verification.user,
                actor=request.user,
                event_type="STUDENT_VERIFICATION_REJECTED",
                title="Student Verification Rejected",
                message=f"Your student verification was declined. Reason: {reason}",
                link_url="/profile"
            )
            action_desc = "rejected"

        return Response({
            "message": f"Student application {action_desc} successfully.",
            "verification": StudentVerificationSerializer(verification).data
        }, status=status.HTTP_200_OK)


class AdminDisputeListView(generics.ListAPIView):
    """
    GET /api/admin/disputes/ & GET /api/v1/admin/disputes/
    Lists all platform disputes with search and status filtering.
    """
    permission_classes = [IsAdminUser]
    serializer_class = DisputeSerializer

    def get_queryset(self):
        qs = Dispute.objects.select_related(
            'booking', 'booking__item', 'raised_by', 'against_user', 'resolved_by'
        ).all()

        status_param = self.request.query_params.get('status')
        if status_param and status_param.upper() != 'ALL':
            qs = qs.filter(status=status_param.upper())

        issue_type = self.request.query_params.get('issue_type')
        if issue_type:
            qs = qs.filter(issue_type=issue_type)

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(description__icontains=search) |
                Q(booking__booking_code__icontains=search) |
                Q(raised_by__email__icontains=search) |
                Q(against_user__email__icontains=search)
            )

        return qs.order_by('-created_at')


class AdminResolveDisputeView(views.APIView):
    """
    POST /api/admin/resolve-dispute/<uuid:id>/ & POST /api/v1/admin/resolve-dispute/<uuid:id>/
    Campus Administrator arbitration endpoint.
    Accepts: { "resolution_decision": "FULL_REFUND_RENTER" | "FORFEIT_DEPOSIT_TO_OWNER" | "SPLIT", "admin_notes": "..." }
    """
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        dispute = get_object_or_404(
            Dispute.objects.select_related('booking', 'raised_by', 'against_user'),
            id=id
        )
        serializer = ResolveDisputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        decision = serializer.validated_data['resolution_decision']
        admin_notes = serializer.validated_data['admin_notes']
        refund_amount = serializer.validated_data.get('refund_amount', Decimal('0.00'))

        dispute.status = Dispute.STATUS_RESOLVED
        dispute.resolution_decision = decision
        dispute.admin_notes = admin_notes
        dispute.resolved_by = request.user
        dispute.resolved_at = timezone.now()
        dispute.save(update_fields=[
            'status', 'resolution_decision', 'admin_notes',
            'resolved_by', 'resolved_at', 'updated_at'
        ])

        # Update underlying booking status
        booking = dispute.booking
        if decision == Dispute.DECISION_FULL_REFUND_RENTER:
            booking.status = Booking.STATUS_CANCELLED
            action_summary = "Full refund approved for renter; security deposit returned."
        elif decision == Dispute.DECISION_FORFEIT_DEPOSIT_TO_OWNER:
            booking.status = Booking.STATUS_COMPLETED
            action_summary = f"Deposit / compensation awarded to equipment owner (₹{dispute.claimed_compensation})."
        else:
            booking.status = Booking.STATUS_COMPLETED
            action_summary = "Split settlement mediated between both parties."

        booking.save(update_fields=['status', 'updated_at'])
        BookingStatusHistory.objects.create(
            booking=booking,
            previous_status=Booking.STATUS_DISPUTED,
            new_status=booking.status,
            reason=f"Admin Resolution #{str(dispute.id)[:8]}: {decision}. {admin_notes}",
            changed_by=request.user
        )

        # Notify Renter & Owner
        send_notification(
            recipient=dispute.raised_by,
            actor=request.user,
            event_type="DISPUTE_RESOLVED",
            title="Dispute Resolved by College Admin",
            message=f"Dispute on rental {booking.item_title} has been resolved: {decision}. Notes: {admin_notes}",
            booking=booking,
            link_url=f"/bookings/{booking.id}"
        )
        send_notification(
            recipient=dispute.against_user,
            actor=request.user,
            event_type="DISPUTE_RESOLVED",
            title="Dispute Mediated & Closed",
            message=f"Dispute on rental {booking.item_title} has been adjudicated: {decision}. Notes: {admin_notes}",
            booking=booking,
            link_url=f"/bookings/{booking.id}"
        )

        return Response({
            "message": "Dispute adjudicated successfully.",
            "action_summary": action_summary,
            "dispute": DisputeSerializer(dispute).data
        }, status=status.HTTP_200_OK)


class StudentDisputeCreateListView(views.APIView):
    """
    GET, POST /api/disputes/ & /api/v1/disputes/
    Students can raise disputes on rentals or list disputes they are involved in.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        disputes = Dispute.objects.filter(
            Q(raised_by=request.user) | Q(against_user=request.user)
        ).select_related('booking', 'raised_by', 'against_user').order_by('-created_at')
        serializer = DisputeSerializer(disputes, many=True)
        return Response({"results": serializer.data, "count": disputes.count()}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateDisputeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        dispute = serializer.save()

        # Mark booking as disputed
        booking = dispute.booking
        booking.status = Booking.STATUS_DISPUTED
        booking.save(update_fields=['status', 'updated_at'])
        BookingStatusHistory.objects.create(
            booking=booking,
            previous_status=Booking.STATUS_ACTIVE,
            new_status=Booking.STATUS_DISPUTED,
            reason=f"Student opened dispute: {dispute.issue_type} - {dispute.description[:100]}",
            changed_by=request.user
        )

        # Notify opposing student
        send_notification(
            recipient=dispute.against_user,
            actor=request.user,
            event_type="DISPUTE_RAISED",
            title=f"Rental Issue Flagged: {dispute.get_issue_type_display()}",
            message=f"{request.user.first_name} raised an issue for rental {booking.item_title}. College administration has been notified for mediation.",
            booking=booking,
            link_url=f"/bookings/{booking.id}"
        )

        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)


class AdminPlatformAnalyticsView(views.APIView):
    """
    GET /api/admin/platform-analytics/ & GET /api/v1/admin/platform-analytics/
    Returns real-time campus health, volume, users, and transaction revenue.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_students = User.objects.filter(is_staff=False).count()
        verified_students = User.objects.filter(is_staff=False, is_college_verified=True).count()
        pending_verifications = StudentVerification.objects.filter(verification_status='PENDING').count()

        active_listings = Item.objects.filter(status=Item.STATUS_ACTIVE, is_published=True).count()
        total_listings = Item.objects.count()

        total_bookings = Booking.objects.count()
        active_rentals = Booking.objects.filter(status=Booking.STATUS_ACTIVE).count()
        completed_rentals = Booking.objects.filter(status=Booking.STATUS_COMPLETED).count()

        # Financial totals
        gmv_data = Booking.objects.filter(
            status__in=[Booking.STATUS_COMPLETED, Booking.STATUS_ACTIVE, Booking.STATUS_PAID_CONFIRMED]
        ).aggregate(
            total_rental_volume=Sum('total_rental_fee'),
            total_deposit_volume=Sum('security_deposit')
        )
        total_rental_volume = float(gmv_data['total_rental_volume'] or 0.0)
        total_deposit_volume = float(gmv_data['total_deposit_volume'] or 0.0)

        # Disputes
        open_disputes = Dispute.objects.filter(status__in=[Dispute.STATUS_OPEN, Dispute.STATUS_UNDER_INVESTIGATION]).count()
        total_disputes = Dispute.objects.count()

        # College distribution
        colleges = College.objects.annotate(
            student_count=Count('users')
        ).values('id', 'name', 'code', 'student_count')[:10]

        return Response({
            "users": {
                "total_students": total_students,
                "verified_students": verified_students,
                "verification_rate_pct": round((verified_students / max(total_students, 1)) * 100, 1),
                "pending_verifications": pending_verifications,
            },
            "marketplace": {
                "active_listings": active_listings,
                "total_listings": total_listings,
                "total_bookings": total_bookings,
                "active_rentals": active_rentals,
                "completed_rentals": completed_rentals,
            },
            "financials": {
                "gross_merchandise_volume_inr": round(total_rental_volume, 2),
                "total_escrow_deposit_held_inr": round(total_deposit_volume, 2),
                "platform_commission_earned_inr": round(total_rental_volume * 0.05, 2),
            },
            "safety_and_disputes": {
                "open_disputes": open_disputes,
                "total_disputes": total_disputes,
                "dispute_rate_pct": round((total_disputes / max(total_bookings, 1)) * 100, 2),
            },
            "colleges": list(colleges),
            "generated_at": timezone.now(),
        }, status=status.HTTP_200_OK)

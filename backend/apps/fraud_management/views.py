from rest_framework import status, views, generics
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from apps.accounts.permissions import IsAdminUser
from apps.fraud_management.models import FraudAlert
from apps.fraud_management.serializers import (
    FraudAlertSerializer,
    FraudAlertActionSerializer,
)
from apps.listings.models import Item
from apps.notifications.services import send_notification


class AdminFraudAlertListView(generics.ListAPIView):
    """
    GET /api/v1/admin/fraud-alerts/
    Lists AI-detected fraud and anomaly risk alerts.
    Supports filtering by ?status=PENDING_REVIEW (default) or ?status=ALL,
    and ?risk_level=HIGH. Restricted to Campus Administrators.
    """
    permission_classes = [IsAdminUser]
    serializer_class = FraudAlertSerializer

    def get_queryset(self):
        status_param = self.request.query_params.get('status', 'PENDING_REVIEW').upper()
        risk_param = self.request.query_params.get('risk_level', '').upper()

        queryset = FraudAlert.objects.select_related(
            'listing', 'listing__category', 'user', 'reviewed_by'
        ).all()

        if status_param != 'ALL':
            queryset = queryset.filter(status=status_param)

        if risk_param:
            queryset = queryset.filter(risk_level=risk_param)

        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            terms = search_query.split()
            search_q = Q()
            for term in terms:
                term_q = (
                    Q(user__first_name__icontains=term) |
                    Q(user__last_name__icontains=term) |
                    Q(user__email__icontains=term) |
                    Q(listing__title__icontains=term)
                )
                search_q &= term_q
            queryset = queryset.filter(search_q)

        return queryset.order_by('-created_at')


class AdminFraudAlertDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/admin/fraud-alerts/{id}/
    Retrieves full details of an anomaly alert including extracted risk signals.
    """
    permission_classes = [IsAdminUser]
    serializer_class = FraudAlertSerializer
    queryset = FraudAlert.objects.select_related(
        'listing', 'listing__category', 'user', 'reviewed_by'
    ).all()
    lookup_field = 'id'


class AdminFraudAlertActionView(views.APIView):
    """
    POST /api/v1/admin/fraud-alerts/{id}/action/
    Admin action to approve (dismiss alert & publish item) or quarantine (take action & remove item).
    """
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        alert = get_object_or_404(FraudAlert, id=id)
        serializer = FraudAlertActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '').strip()

        alert.reviewed_by = request.user
        alert.reviewed_at = timezone.now()
        alert.review_notes = notes

        if action in ['APPROVE', 'DISMISS']:
            alert.status = FraudAlert.STATUS_DISMISSED
            alert.save()

            if alert.listing:
                alert.listing.is_published = True
                alert.listing.status = Item.STATUS_ACTIVE
                alert.listing.save(update_fields=['is_published', 'status'])

                send_notification(
                    recipient=alert.user,
                    actor=request.user,
                    event_type="LISTING_APPROVED",
                    title="Listing Approved!",
                    message=f"Your resource '{alert.listing.title}' has passed administrative verification and is now active on campus."
                )

            return Response({
                "message": f"Alert {alert.id} dismissed and item approved successfully.",
                "alert": FraudAlertSerializer(alert).data
            }, status=status.HTTP_200_OK)

        elif action in ['QUARANTINE', 'TAKE_ACTION']:
            alert.status = FraudAlert.STATUS_ACTION_TAKEN
            alert.save()

            if alert.listing:
                alert.listing.is_published = False
                alert.listing.status = Item.STATUS_REMOVED
                alert.listing.save(update_fields=['is_published', 'status'])

                send_notification(
                    recipient=alert.user,
                    actor=request.user,
                    event_type="LISTING_REMOVED",
                    title="Listing Removed by Administration",
                    message=f"Your resource '{alert.listing.title}' was quarantined or removed. Reason: {notes or 'Safety policy violation.'}",
                    metadata={"reason": notes}
                )

            return Response({
                "message": f"Alert {alert.id} confirmed: Action taken and item quarantined.",
                "alert": FraudAlertSerializer(alert).data
            }, status=status.HTTP_200_OK)


class AdminFraudStatsView(views.APIView):
    """
    GET /api/v1/admin/fraud-stats/
    Overview stats on flagged anomalies, high-risk items, and admin resolutions.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_alerts = FraudAlert.objects.count()
        pending_reviews = FraudAlert.objects.filter(status=FraudAlert.STATUS_PENDING_REVIEW).count()
        high_risk_alerts = FraudAlert.objects.filter(risk_level=FraudAlert.RISK_HIGH).count()
        medium_risk_alerts = FraudAlert.objects.filter(risk_level=FraudAlert.RISK_MEDIUM).count()
        action_taken_count = FraudAlert.objects.filter(status=FraudAlert.STATUS_ACTION_TAKEN).count()
        quarantined_items = Item.objects.filter(is_published=False, fraud_alerts__status=FraudAlert.STATUS_PENDING_REVIEW).distinct().count()

        return Response({
            "total_alerts": total_alerts,
            "pending_reviews": pending_reviews,
            "high_risk_alerts": high_risk_alerts,
            "medium_risk_alerts": medium_risk_alerts,
            "action_taken_count": action_taken_count,
            "quarantined_items_count": quarantined_items,
        }, status=status.HTTP_200_OK)


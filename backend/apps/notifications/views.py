from rest_framework import status, views, generics, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    """
    GET /api/v1/notifications/
    Returns paginated notifications for the authenticated student,
    ordered with newest notifications first.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = NotificationPagination

    def get_queryset(self):
        qs = Notification.objects.filter(
            recipient=self.request.user
        ).select_related('actor', 'booking').order_by('-created_at')

        search = self.request.query_params.get('search', '').strip()
        if search:
            terms = search.split()
            search_q = Q()
            for term in terms:
                term_q = (
                    Q(title__icontains=term) |
                    Q(message__icontains=term) |
                    Q(actor__first_name__icontains=term) |
                    Q(actor__last_name__icontains=term) |
                    Q(event_type__icontains=term)
                )
                search_q &= term_q
            qs = qs.filter(search_q)

        return qs


class UnreadNotificationCountView(views.APIView):
    """
    GET /api/v1/notifications/unread-count/
    Returns the exact count of unread notifications for badge rendering.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)


class MarkNotificationReadView(views.APIView):
    """
    POST /api/v1/notifications/<uuid:id>/read/
    Marks a single notification as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        notification = get_object_or_404(Notification, id=id, recipient=request.user)
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=['is_read', 'read_at'])

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MarkAllNotificationsReadView(views.APIView):
    """
    POST /api/v1/notifications/read-all/
    Marks all unread notifications for the student as read in bulk.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        now = timezone.now()
        updated_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True, read_at=now)

        return Response({
            "detail": "All notifications marked as read.",
            "updated_count": updated_count
        }, status=status.HTTP_200_OK)


class DeleteNotificationView(views.APIView):
    """
    DELETE /api/v1/notifications/<uuid:id>/
    Permanently deletes a notification belonging to the student to free DB storage.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, id):
        notification = get_object_or_404(Notification, id=id, recipient=request.user)
        notification.delete()
        return Response({
            "detail": "Notification permanently deleted.",
            "id": str(id)
        }, status=status.HTTP_200_OK)

    def post(self, request, id):
        return self.delete(request, id)


class ClearNotificationHistoryView(views.APIView):
    """
    DELETE /api/v1/notifications/clear/
    Permanently removes notifications belonging to the authenticated student
    to reclaim database storage space.
    Query parameter ?scope=
      - 'read' (default): Purges all notifications where is_read=True
      - 'all': Purges all notifications for the user
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        scope = request.query_params.get('scope', 'read').strip().lower()
        qs = Notification.objects.filter(recipient=request.user)

        if scope == 'all':
            deleted_count, _ = qs.delete()
            detail = f"Successfully cleared all {deleted_count} notifications from history. Database storage reclaimed."
        else:
            deleted_count, _ = qs.filter(is_read=True).delete()
            detail = f"Successfully cleared {deleted_count} read notifications from history. Database storage reclaimed."

        return Response({
            "detail": detail,
            "deleted_count": deleted_count,
            "scope": scope
        }, status=status.HTTP_200_OK)

    def post(self, request):
        return self.delete(request)



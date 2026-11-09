from django.urls import path
from apps.notifications.views import (
    NotificationListView,
    UnreadNotificationCountView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    DeleteNotificationView,
    ClearNotificationHistoryView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='notification-unread-count'),
    path('clear/', ClearNotificationHistoryView.as_view(), name='notification-clear-history'),
    path('read-all/', MarkAllNotificationsReadView.as_view(), name='notification-read-all'),
    path('<uuid:id>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('<uuid:id>/delete/', DeleteNotificationView.as_view(), name='notification-delete-alt'),
    path('<uuid:id>/', DeleteNotificationView.as_view(), name='notification-delete'),
]


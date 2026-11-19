from django.urls import path
from apps.fraud_management.views import (
    AdminFraudAlertListView,
    AdminFraudAlertDetailView,
    AdminFraudAlertActionView,
    AdminFraudStatsView,
)

urlpatterns = [
    path('fraud-alerts/', AdminFraudAlertListView.as_view(), name='admin-fraud-alerts-list'),
    path('fraud-alerts/<uuid:id>/', AdminFraudAlertDetailView.as_view(), name='admin-fraud-alerts-detail'),
    path('fraud-alerts/<uuid:id>/action/', AdminFraudAlertActionView.as_view(), name='admin-fraud-alerts-action'),
    path('fraud-stats/', AdminFraudStatsView.as_view(), name='admin-fraud-stats'),
]

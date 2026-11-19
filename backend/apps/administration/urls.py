from django.urls import path
from apps.administration.views import (
    AdminVerificationListView,
    AdminVerificationDetailView,
    AdminVerificationApproveView,
    AdminVerificationRejectView,
    AdminVerifyStudentView,
    AdminDisputeListView,
    AdminResolveDisputeView,
    StudentDisputeCreateListView,
    AdminPlatformAnalyticsView,
)

urlpatterns = [
    # Verifications
    path('verifications/', AdminVerificationListView.as_view(), name='admin-verifications-list'),
    path('verifications/<uuid:id>/', AdminVerificationDetailView.as_view(), name='admin-verification-detail'),
    path('verifications/<uuid:id>/approve/', AdminVerificationApproveView.as_view(), name='admin-verification-approve'),
    path('verifications/<uuid:id>/reject/', AdminVerificationRejectView.as_view(), name='admin-verification-reject'),
    path('pending-verifications/', AdminVerificationListView.as_view(), name='admin-pending-verifications'),
    path('verify-student/<uuid:id>/', AdminVerifyStudentView.as_view(), name='admin-verify-student'),

    # Disputes
    path('disputes/', AdminDisputeListView.as_view(), name='admin-disputes-list'),
    path('resolve-dispute/<uuid:id>/', AdminResolveDisputeView.as_view(), name='admin-resolve-dispute'),

    # Platform Health & Analytics
    path('platform-analytics/', AdminPlatformAnalyticsView.as_view(), name='admin-platform-analytics'),
]

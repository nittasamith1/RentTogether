"""
RentTogether URL Configuration — Phase 02 Foundation & Auth
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

from config.health import HealthCheckView
from apps.accounts.views import (
    ActiveCollegeView,
    RegisterView,
    VerifyEmailView,
    ResendOTPView,
    LoginView,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)
from apps.administration.views import (
    AdminVerificationListView,
    AdminVerificationDetailView,
    AdminVerificationApproveView,
    AdminVerificationRejectView,
)

auth_patterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]

admin_verification_patterns = [
    path('verifications/', AdminVerificationListView.as_view(), name='admin-verifications-list'),
    path('verifications/<uuid:id>/', AdminVerificationDetailView.as_view(), name='admin-verification-detail'),
    path('verifications/<uuid:id>/approve/', AdminVerificationApproveView.as_view(), name='admin-verification-approve'),
    path('verifications/<uuid:id>/reject/', AdminVerificationRejectView.as_view(), name='admin-verification-reject'),
]

urlpatterns = [
    # Django Admin Portal
    path('admin/', admin.site.urls),

    # Health Check Endpoint
    path('api/v1/health/', HealthCheckView.as_view(), name='health-check'),

    # Phase 02, 03 & 04 API Endpoints
    path('api/v1/auth/', include(auth_patterns)),
    path('api/v1/profiles/', include('apps.profiles.urls')),
    path('api/v1/marketplace/', include('apps.marketplace.urls')),
    path('api/v1/colleges/active/', ActiveCollegeView.as_view(), name='college-active'),
    path('api/v1/admin/', include(admin_verification_patterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

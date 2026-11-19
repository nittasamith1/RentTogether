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
from apps.administration.views import StudentDisputeCreateListView
from apps.listings.views import PriceRecommendationView

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

urlpatterns = [
    # Root & Health Check Endpoints (for Render health monitoring)
    path('', HealthCheckView.as_view(), name='root-health'),
    path('api/v1/health/', HealthCheckView.as_view(), name='health-check'),

    # Django Admin Portal
    path('admin/', admin.site.urls),

    # Phase 10: AI Fair Price Prediction Engine
    path('api/ai/predict-price/', PriceRecommendationView.as_view(), name='ai-predict-price-root'),
    path('api/v1/ai/predict-price/', PriceRecommendationView.as_view(), name='ai-predict-price'),

    # Phase 13: AI Content-Based & Complementary Recommendations
    path('api/v1/ai/recommendations/', include('apps.recommendations.urls')),
    path('api/ai/recommendations/', include('apps.recommendations.urls')),

    # Phase 14: Campus Sustainability Impact Analytics & KPI Dashboard
    path('api/v1/sustainability/', include('apps.sustainability.urls')),
    path('api/sustainability/', include('apps.sustainability.urls')),

    # Phase 02, 03, 04, 05, 06 & 07 API Endpoints
    path('api/v1/auth/', include(auth_patterns)),
    path('api/v1/profiles/', include('apps.profiles.urls')),
    path('api/v1/marketplace/', include('apps.marketplace.urls')),
    path('api/marketplace/', include('apps.marketplace.urls')),
    path('api/v1/listings/', include('apps.listings.urls')),
    path('api/listings/', include('apps.listings.urls')),
    path('api/v1/availability/', include('apps.availability.urls')),
    path('api/v1/bookings/', include('apps.bookings.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/v1/colleges/active/', ActiveCollegeView.as_view(), name='college-active'),

    # Phase 15: College-Specific Admin Portal & On-Ground Dispute Mediation
    path('api/v1/admin/', include('apps.administration.urls')),
    path('api/admin/', include('apps.administration.urls')),
    path('api/v1/disputes/', StudentDisputeCreateListView.as_view(), name='disputes-v1'),
    path('api/disputes/', StudentDisputeCreateListView.as_view(), name='disputes-root'),

    # Phase 12: Fraud Management
    path('api/v1/admin/', include('apps.fraud_management.urls')),
    path('api/admin/', include('apps.fraud_management.urls')),
    path('api/v1/fraud/', include('apps.fraud_management.urls')),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

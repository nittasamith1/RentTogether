"""
RentTogether URL Configuration
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from config.health import HealthCheckView

urlpatterns = [
    # Admin Portal
    path('admin/', admin.site.urls),

    # Health Check Endpoint
    path('api/v1/health/', HealthCheckView.as_view(), name='health-check'),

    # JWT Authentication Endpoints
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

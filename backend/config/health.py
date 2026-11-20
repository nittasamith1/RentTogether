from datetime import datetime, timezone
from django.db import connection
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from apps.accounts.models import College

class HealthCheckView(APIView):
    """
    Health check endpoint for RentTogether platform.
    - Fast liveness probe on `/health/` (0 database queries) for Render health check monitor.
    - Deep readiness probe on `/api/v1/health/` verifying Neon PostgreSQL connectivity and college setup.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # Lightweight probe for container health monitoring (0 database queries)
        is_lightweight = request.path.strip('/') == 'health' and request.query_params.get('db') != 'true'
        if is_lightweight:
            return JsonResponse({
                "status": "healthy",
                "backend": "online",
                "runtime": "render-production",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }, status=200)

        # Full readiness probe with Neon database connectivity verification
        db_status = "connected"
        db_error = None
        college_count = 0
        default_college_info = None

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

            # Check colleges if table exists
            college_count = College.objects.count()
            active_college = College.objects.filter(is_active=True).first()
            if active_college:
                default_college_info = {
                    "name": active_college.name,
                    "code": active_college.code,
                    "domain_whitelist": active_college.domains_list,
                }
        except Exception as exc:
            db_status = "disconnected"
            db_error = str(exc)

        response_data = {
            "status": "healthy" if db_status == "connected" else "degraded",
            "backend": "online",
            "database": db_status,
            "database_engine": connection.settings_dict.get('ENGINE', 'unknown'),
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "college_count": college_count,
            "default_college": default_college_info,
            "scope": "Version 1 — Single-College Platform",
        }

        if db_error:
            from django.conf import settings
            response_data["database_error"] = db_error if settings.DEBUG else "Database connection unavailable."
            return JsonResponse(response_data, status=503)

        return JsonResponse(response_data, status=200)


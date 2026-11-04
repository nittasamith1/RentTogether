from datetime import datetime, timezone
from django.db import connection
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from apps.accounts.models import College

class HealthCheckView(APIView):
    """
    Health check endpoint for RentTogether platform.
    Verifies backend runtime, database accessibility, and institutional setup.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
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
            response_data["database_error"] = db_error
            return JsonResponse(response_data, status=503)

        return JsonResponse(response_data, status=200)

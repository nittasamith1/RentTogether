from rest_framework import status, views, permissions
from rest_framework.response import Response
from apps.sustainability.services.impact_calculator import (
    calculate_student_impact,
    calculate_campus_impact,
)


class StudentImpactView(views.APIView):
    """
    GET /api/sustainability/my-impact/
    GET /api/v1/sustainability/my-impact/
    Returns the student's individual environmental savings, money saved vs retail,
    and percentile contribution.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        impact_data = calculate_student_impact(request.user)
        return Response(impact_data, status=status.HTTP_200_OK)


class CampusImpactView(views.APIView):
    """
    GET /api/sustainability/campus-impact/
    GET /api/v1/sustainability/campus-impact/
    Returns aggregate campus-wide sustainability metrics, waste prevented,
    and money saved across all verified university students.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        college = getattr(request.user, 'college', None) if request.user and request.user.is_authenticated else None
        campus_data = calculate_campus_impact(college=college)
        return Response(campus_data, status=status.HTTP_200_OK)

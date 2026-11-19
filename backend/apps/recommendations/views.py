from rest_framework import status, views, permissions
from rest_framework.response import Response
from apps.recommendations.services import (
    get_personalized_recommendations,
    get_complementary_recommendations,
    get_similar_items,
)


class PersonalizedRecommendationsView(views.APIView):
    """
    GET /api/ai/recommendations/personalized/
    GET /api/v1/ai/recommendations/personalized/
    Returns personalized gear recommendations based on student rental history & wishlists.
    Falls back to cold-start top-rated items for new students.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        limit = max(1, min(limit, 30))

        data = get_personalized_recommendations(request.user, limit=limit)
        return Response(data, status=status.HTTP_200_OK)


class ComplementaryRecommendationsView(views.APIView):
    """
    GET /api/ai/recommendations/complementary/<item_id>/
    GET /api/v1/ai/recommendations/complementary/<item_id>/
    Returns complementary accessory pairings and content-similar equipment
    for the Item Detail view ("Students Also Rent These Together").
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, item_id):
        limit = int(request.query_params.get('limit', 6))
        limit = max(1, min(limit, 20))

        comp_data = get_complementary_recommendations(str(item_id), limit=limit)
        similar_items = get_similar_items(str(item_id), limit=limit)

        comp_data['similar_items'] = similar_items

        return Response(comp_data, status=status.HTTP_200_OK)

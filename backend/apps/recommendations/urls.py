from django.urls import path
from apps.recommendations.views import (
    PersonalizedRecommendationsView,
    ComplementaryRecommendationsView,
)

urlpatterns = [
    path('personalized/', PersonalizedRecommendationsView.as_view(), name='ai-recommendations-personalized'),
    path('complementary/<uuid:item_id>/', ComplementaryRecommendationsView.as_view(), name='ai-recommendations-complementary'),
]

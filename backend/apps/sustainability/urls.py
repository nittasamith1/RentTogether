from django.urls import path
from apps.sustainability.views import (
    StudentImpactView,
    CampusImpactView,
)

urlpatterns = [
    path('my-impact/', StudentImpactView.as_view(), name='sustainability-my-impact'),
    path('campus-impact/', CampusImpactView.as_view(), name='sustainability-campus-impact'),
]

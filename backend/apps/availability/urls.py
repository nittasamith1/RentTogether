from django.urls import path
from apps.availability.views import (
    ItemAvailabilityView,
    CheckItemAvailabilityView,
    CreateManualBlockView,
    DeleteManualBlockView,
    OwnerCalendarView,
)

urlpatterns = [
    # Item-specific availability
    path('items/<uuid:item_id>/', ItemAvailabilityView.as_view(), name='item-availability'),
    path('items/<uuid:item_id>/check/', CheckItemAvailabilityView.as_view(), name='check-item-availability'),
    path('items/<uuid:item_id>/blocks/', CreateManualBlockView.as_view(), name='create-manual-block'),

    # Block-specific actions
    path('blocks/<uuid:block_id>/', DeleteManualBlockView.as_view(), name='delete-manual-block'),

    # Owner calendar
    path('my-calendar/', OwnerCalendarView.as_view(), name='owner-calendar'),
]


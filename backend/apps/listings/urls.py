from django.urls import path
from apps.listings.views import (
    CreateListingView,
    MyListingsListView,
    OwnerListingDetailView,
    ListingStatusUpdateView,
    ItemImageActionView,
    PriceRecommendationView,
    OwnerListingRentalHistoryView,
)

urlpatterns = [
    # Listing Creation
    path('create/', CreateListingView.as_view(), name='listing-create'),

    # My Listings (Owner inventory dashboard)
    path('my-listings/', MyListingsListView.as_view(), name='listing-my-listings'),

    # AI Price Recommendation
    path('price-recommendation/', PriceRecommendationView.as_view(), name='listing-price-recommendation'),

    # Item Management & Partial Updates
    path('<uuid:item_id>/', OwnerListingDetailView.as_view(), name='listing-detail'),

    # Rental history of the item
    path('<uuid:item_id>/rental-history/', OwnerListingRentalHistoryView.as_view(), name='listing-rental-history'),

    # Pause / Resume status transition
    path('<uuid:item_id>/status/', ListingStatusUpdateView.as_view(), name='listing-status-update'),

    # Image upload & deletion
    path('<uuid:item_id>/images/', ItemImageActionView.as_view(), name='listing-images-add'),
    path('<uuid:item_id>/images/<uuid:image_id>/', ItemImageActionView.as_view(), name='listing-image-delete'),
]


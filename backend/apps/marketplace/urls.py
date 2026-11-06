from django.urls import path
from apps.marketplace.views import (
    CategoryListView,
    MarketplaceItemListView,
    MarketplaceItemDetailView,
    WishlistActionView,
    WishlistListView,
    PopularItemsView,
)

urlpatterns = [
    # Category catalog
    path('categories/', CategoryListView.as_view(), name='marketplace-categories'),

    # Marketplace Item Listings (search, filters, sorting)
    path('items/', MarketplaceItemListView.as_view(), name='marketplace-items'),

    # Item Detail Inspection
    path('items/<uuid:item_id>/', MarketplaceItemDetailView.as_view(), name='marketplace-item-detail'),

    # Wishlist operations
    path('items/<uuid:item_id>/wishlist/', WishlistActionView.as_view(), name='marketplace-item-wishlist'),
    path('wishlist/', WishlistListView.as_view(), name='marketplace-wishlist'),

    # Popular / Trending intra-campus resources
    path('popular/', PopularItemsView.as_view(), name='marketplace-popular'),
]

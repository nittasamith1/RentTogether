from rest_framework import status, views, generics
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError

from apps.marketplace.models import Category
from apps.marketplace.permissions import IsVerifiedStudent
from apps.marketplace.pagination import MarketplacePagination
from apps.marketplace.serializers import (
    CategorySerializer,
    MarketplaceItemSummarySerializer,
    MarketplaceItemDetailSerializer,
    WishlistEntrySerializer,
)
from apps.marketplace.services.marketplace_service import (
    get_marketplace_items_queryset,
    get_item_detail,
)
from apps.marketplace.services.wishlist_service import (
    add_to_wishlist,
    remove_from_wishlist,
    get_user_wishlist_items,
)
from apps.marketplace.services.popularity_service import get_popular_items


class CategoryListView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/categories/
    Returns active resource categories ordered by display_order,
    including the count of active listings available in the student's college.
    """
    permission_classes = [IsVerifiedStudent]
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True).order_by('display_order', 'name')


class MarketplaceItemListView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/items/
    Paginated, multi-faceted searchable intra-campus resource listings.
    Strictly isolated to resources shared within the authenticated student's college.
    """
    permission_classes = [IsVerifiedStudent]
    serializer_class = MarketplaceItemSummarySerializer
    pagination_class = MarketplacePagination

    def get_queryset(self):
        try:
            return get_marketplace_items_queryset(self.request.user, self.request.query_params)
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError(detail=exc.messages if hasattr(exc, 'messages') else str(exc))


class MarketplaceItemDetailView(views.APIView):
    """
    GET /api/v1/marketplace/items/<item_id>/
    Returns full details for a resource item, including images, owner reputation,
    availability info, and related items.
    Enforces college isolation (returns 404 for cross-college access).
    """
    permission_classes = [IsVerifiedStudent]

    def get(self, request, item_id):
        detail_data = get_item_detail(request.user, item_id)
        item = detail_data["item"]
        serializer = MarketplaceItemDetailSerializer(
            item,
            context={
                "request": request,
                "related_items": detail_data["related_items"],
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class WishlistActionView(views.APIView):
    """
    POST /api/v1/marketplace/items/<item_id>/wishlist/
    DELETE /api/v1/marketplace/items/<item_id>/wishlist/
    Explicit endpoints for saving and removing items from a student's personal wishlist.
    """
    permission_classes = [IsVerifiedStudent]

    def post(self, request, item_id):
        try:
            _, created = add_to_wishlist(request.user, item_id)
            message = "Item added to wishlist." if created else "Item is already in your wishlist."
            return Response(
                {
                    "item_id": str(item_id),
                    "is_wishlisted": True,
                    "message": message,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.messages if hasattr(exc, 'messages') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, item_id):
        removed = remove_from_wishlist(request.user, item_id)
        return Response(
            {
                "item_id": str(item_id),
                "is_wishlisted": False,
                "message": "Item removed from wishlist." if removed else "Item was not in your wishlist.",
            },
            status=status.HTTP_200_OK
        )


class WishlistListView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/wishlist/
    Returns paginated items saved by the authenticated student.
    """
    permission_classes = [IsVerifiedStudent]
    serializer_class = MarketplaceItemSummarySerializer
    pagination_class = MarketplacePagination

    def get_queryset(self):
        return get_user_wishlist_items(self.request.user)


class PopularItemsView(views.APIView):
    """
    GET /api/v1/marketplace/popular/
    Returns the top 8 popular resources within the student's college.
    """
    permission_classes = [IsVerifiedStudent]

    def get(self, request):
        popular_qs = get_popular_items(request.user, limit=8)
        serializer = MarketplaceItemSummarySerializer(
            popular_qs,
            many=True,
            context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

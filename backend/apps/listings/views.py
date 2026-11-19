from rest_framework import views, status, generics, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError, PermissionDenied
from django.http import Http404

from apps.listings.models import Item
from apps.listings.permissions import IsVerifiedStudentOwner
from apps.marketplace.pagination import MarketplacePagination
from apps.listings.serializers import (
    CreateListingSerializer,
    UpdateListingSerializer,
    OwnerListingSummarySerializer,
    OwnerListingDetailSerializer,
    ItemImageListingSerializer,
    PriceRecommendationRequestSerializer,
)
from apps.listings.services.listing_service import (
    create_listing,
    get_owner_listings,
    get_owner_listing_detail,
    update_listing,
    set_listing_status,
    soft_delete_listing,
)
from apps.listings.services.image_service import (
    process_and_save_item_images,
    delete_item_image,
)
from ml_engine.services.pricing_service import predict_fair_rental_price


class CreateListingView(views.APIView):
    """
    POST /api/v1/listings/create/
    Creates and publishes a new resource listing with photographs.
    """
    permission_classes = [IsVerifiedStudentOwner]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CreateListingSerializer(data=request.data)
        if not serializer.is_valid():
            first_key = next(iter(serializer.errors.keys()), "input")
            first_val = serializer.errors[first_key]
            first_msg = first_val[0] if isinstance(first_val, list) and first_val else str(first_val)
            err_dict = dict(serializer.errors)
            err_dict['detail'] = f"{first_key.replace('_', ' ').capitalize()}: {first_msg}"
            return Response(err_dict, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve images from multipart upload
        image_files = request.FILES.getlist('images') or request.FILES.getlist('images[]')
        if not image_files:
            return Response(
                {
                    "detail": "At least one photograph is required to publish a listing.",
                    "images": ["At least one photograph is required to publish a listing."]
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            item = create_listing(request.user, serializer.validated_data, image_files)
            from apps.notifications.services import send_notification
            if not item.is_published:
                send_notification(
                    recipient=request.user,
                    event_type="LISTING_QUARANTINED",
                    title="Listing Held for Security Review",
                    message=f"Your resource '{item.title}' has been temporarily placed in the campus safety review queue. A college administrator will verify it shortly."
                )
            else:
                hourly = (item.rental_price_per_day / 24)
                send_notification(
                    recipient=request.user,
                    event_type="LISTING_PUBLISHED",
                    title="Listing Published!",
                    message=f"Your resource '{item.title}' is now live and discoverable on campus at ₹{item.rental_price_per_day}/day (₹{hourly:.2f}/hr)."
                )
            output = OwnerListingDetailSerializer(item).data
            return Response(output, status=status.HTTP_201_CREATED)
        except ValidationError as exc:
            return Response(
                {"detail": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionDenied as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)


class MyListingsListView(views.APIView):
    """
    GET /api/v1/listings/my-listings/
    Returns equipment listings belonging to the authenticated student along with summary stats.
    """
    permission_classes = [IsVerifiedStudentOwner]

    def get(self, request):
        status_param = request.query_params.get('status')
        category_param = request.query_params.get('category')
        search_param = request.query_params.get('search')

        filters = {
            'status': status_param,
            'category': category_param,
            'search': search_param,
        }

        qs = get_owner_listings(request.user, filters)

        # Overview statistics across all owner items
        all_owner_items = Item.objects.filter(owner=request.user)
        stats = {
            'total_listings': all_owner_items.exclude(status=Item.STATUS_REMOVED).count(),
            'active_listings': all_owner_items.filter(status=Item.STATUS_ACTIVE).count(),
            'paused_listings': all_owner_items.filter(status=Item.STATUS_PAUSED).count(),
            'total_completed_rentals': sum(item.rental_count for item in all_owner_items),
        }

        paginator = MarketplacePagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = OwnerListingSummarySerializer(page, many=True)
        response_data = paginator.get_paginated_response(serializer.data).data
        response_data['stats'] = stats
        return Response(response_data, status=status.HTTP_200_OK)


class OwnerListingDetailView(views.APIView):
    """
    GET /api/v1/listings/<item_id>/
    PATCH /api/v1/listings/<item_id>/
    DELETE /api/v1/listings/<item_id>/
    """
    permission_classes = [IsVerifiedStudentOwner]

    def get(self, request, item_id):
        item = get_owner_listing_detail(request.user, item_id)
        serializer = OwnerListingDetailSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, item_id):
        serializer = UpdateListingSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = update_listing(request.user, item_id, serializer.validated_data)
            output = OwnerListingDetailSerializer(item).data
            return Response(output, status=status.HTTP_200_OK)
        except ValidationError as exc:
            return Response(
                {"detail": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, item_id):
        item = soft_delete_listing(request.user, item_id)
        return Response(
            {
                "id": str(item.id),
                "status": item.status,
                "message": "Listing successfully removed from campus marketplace."
            },
            status=status.HTTP_200_OK
        )


class ListingStatusUpdateView(views.APIView):
    """
    PATCH /api/v1/listings/<item_id>/status/
    Transitions listing status between ACTIVE and PAUSED.
    """
    permission_classes = [IsVerifiedStudentOwner]

    def patch(self, request, item_id):
        new_status = request.data.get('status')
        if not new_status:
            return Response({"status": ["Status field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = set_listing_status(request.user, item_id, new_status)
            from apps.notifications.services import send_notification
            send_notification(
                recipient=request.user,
                event_type=f"LISTING_{item.status}",
                title=f"Listing {item.status.capitalize()}",
                message=f"Your resource '{item.title}' is now {item.status.lower()}."
            )
            return Response(
                {
                    "id": str(item.id),
                    "status": item.status,
                    "is_published": item.is_published,
                    "message": f"Listing is now {item.status.lower()}."
                },
                status=status.HTTP_200_OK
            )
        except ValidationError as exc:
            return Response(
                {"detail": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ItemImageActionView(views.APIView):
    """
    POST /api/v1/listings/<item_id>/images/ (Add photos)
    DELETE /api/v1/listings/<item_id>/images/<image_id>/ (Remove photo)
    """
    permission_classes = [IsVerifiedStudentOwner]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, item_id):
        item = get_owner_listing_detail(request.user, item_id)
        files = request.FILES.getlist('images') or request.FILES.getlist('images[]')
        if not files:
            return Response({"images": ["No images provided."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            created = process_and_save_item_images(item, files)
            serializer = ItemImageListingSerializer(created, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as exc:
            return Response(
                {"detail": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, item_id, image_id):
        item = get_owner_listing_detail(request.user, item_id)
        try:
            delete_item_image(item, image_id)
            return Response({"message": "Image successfully removed."}, status=status.HTTP_200_OK)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class PriceRecommendationView(views.APIView):
    """
    POST /api/v1/listings/price-recommendation/
    POST /api/ai/predict-price/
    Returns AI-generated fair rental price prediction, confidence score, pricing status, and recommended bounds.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PriceRecommendationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            recommendation = predict_fair_rental_price(
                category=data['category'],
                original_price=data['original_price'],
                condition=data.get('condition', 'GOOD'),
                age_months=data.get('item_age_months', 0),
                item_brand_tier=data.get('item_brand_tier', 'MID_TIER'),
                campus_demand_score=data.get('campus_demand_score', 3.0),
                rental_duration_days=data.get('rental_duration_days', 1),
                current_price=data.get('current_price', None)
            )
            return Response(recommendation, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class OwnerListingRentalHistoryView(views.APIView):
    """
    GET /api/v1/listings/<item_id>/rental-history/
    Returns past and active rental booking records for this item.
    Enforces that only the authenticated item owner can view its transaction history.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, item_id):
        try:
            item = Item.objects.select_related('category', 'owner').prefetch_related('bookings').get(id=item_id)
        except (Item.DoesNotExist, ValueError, Exception):
            return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        if item.owner_id != request.user.id and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to view rental history for this item.'},
                status=status.HTTP_403_FORBIDDEN
            )

        history = []
        try:
            from apps.profiles.models import StudentReview
            bookings = item.bookings.select_related('renter').order_by('-created_at')
            for b in bookings:
                try:
                    renter_name = "Campus Student"
                    renter_avatar = ""
                    if getattr(b, 'renter', None):
                        renter_name = b.renter.get_full_name() or b.renter.username or "Campus Student"
                        try:
                            profile = getattr(b.renter, 'profile', None)
                            if profile and getattr(profile, 'avatar', None):
                                renter_avatar = str(profile.avatar)
                        except Exception:
                            renter_avatar = ""

                    start_d = b.start_date.isoformat() if getattr(b, 'start_date', None) and hasattr(b.start_date, 'isoformat') else str(getattr(b, 'start_date', ''))
                    end_d = b.end_date.isoformat() if getattr(b, 'end_date', None) and hasattr(b.end_date, 'isoformat') else str(getattr(b, 'end_date', ''))
                    ret_d = b.returned_at.isoformat() if getattr(b, 'returned_at', None) and hasattr(b.returned_at, 'isoformat') else None
                    price_val = float(getattr(b, 'total_rental_fee', 0.0) or 0.0)

                    has_reviewed = False
                    try:
                        has_reviewed = StudentReview.objects.filter(booking=b, reviewer=request.user).exists()
                    except Exception:
                        has_reviewed = False

                    ref = getattr(b, 'booking_reference', None) or getattr(b, 'booking_code', None) or f"RT-{str(b.id)[:8]}"

                    history.append({
                        'id': str(b.id),
                        'booking_reference': ref,
                        'renter_name': renter_name,
                        'renter_avatar': renter_avatar,
                        'status': getattr(b, 'status', 'COMPLETED'),
                        'start_date': start_d,
                        'end_date': end_d,
                        'actual_return_date': ret_d,
                        'rental_price_inr': price_val,
                        'deposit_amount_inr': 0.0,
                        'pickup_spot': getattr(b, 'pickup_spot', '') or 'Campus Handover Desk',
                        'created_at': b.created_at.isoformat() if getattr(b, 'created_at', None) and hasattr(b.created_at, 'isoformat') else '',
                        'has_reviewed': has_reviewed,
                    })
                except Exception:
                    continue
        except Exception:
            history = []

        return Response({
            'item_id': str(item.id),
            'item_title': item.title,
            'total_rentals': getattr(item, 'rental_count', len(history)),
            'rental_history': history,
        }, status=status.HTTP_200_OK)



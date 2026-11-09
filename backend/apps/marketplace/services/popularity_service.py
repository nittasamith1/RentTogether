from django.db.models import Count, Q, F, FloatField, ExpressionWrapper
from django.db.models.functions import Coalesce, Cast
from django.utils import timezone
from apps.listings.models import Item
from apps.bookings.models import Booking
from apps.availability.models import ItemAvailabilityBlock


def get_popular_items(user, limit: int = 8):
    """
    Retrieves the top popular resources within the authenticated student's college.
    Ranking is computed from completed rental counts, wishlist demand, and owner reputation.
    Excludes the student's own items and items blocked by their owner for booking.
    """
    if not user or not user.is_authenticated or not user.college_id:
        return Item.objects.none()

    today = timezone.now().date()
    owner_blocked_item_ids = ItemAvailabilityBlock.objects.filter(
        reason__in=[
            ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            ItemAvailabilityBlock.REASON_MAINTENANCE
        ],
        end_date__gt=today
    ).values_list('item_id', flat=True)

    qs = Item.objects.filter(
        owner__college_id=user.college_id,
        status=Item.STATUS_ACTIVE,
        is_published=True,
        category__is_active=True
    ).exclude(
        owner_id=user.id
    ).exclude(
        id__in=owner_blocked_item_ids
    ).select_related(
        'owner',
        'category',
        'owner__profile'
    ).prefetch_related(
        'images'
    )

    # Annotate metrics
    qs = qs.annotate(
        completed_rentals=Count('bookings', filter=Q(bookings__status=Booking.STATUS_COMPLETED), distinct=True),
        wishlist_count=Count('wishlist_entries', distinct=True),
        owner_score=Coalesce(Cast('owner__profile__reputation_as_owner', FloatField()), 5.0),
    )

    # Score calculation: 3.0 * completed_rentals + 1.0 * wishlist_count + 0.5 * owner_score
    qs = qs.annotate(
        popularity_score=ExpressionWrapper(
            (Cast(F('completed_rentals'), FloatField()) * 3.0) +
            (Cast(F('wishlist_count'), FloatField()) * 1.0) +
            (F('owner_score') * 0.5),
            output_field=FloatField()
        )
    ).order_by('-popularity_score', '-created_at')

    return qs[:limit]

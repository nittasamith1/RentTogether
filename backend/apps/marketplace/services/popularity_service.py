from django.db.models import Count, Q, F, FloatField, ExpressionWrapper
from django.db.models.functions import Coalesce, Cast
from apps.listings.models import Item
from apps.bookings.models import Booking


def get_popular_items(user, limit: int = 8):
    """
    Retrieves the top popular resources within the authenticated student's college.
    Ranking is computed from completed rental counts, wishlist demand, and owner reputation.
    """
    if not user or not user.is_authenticated or not user.college_id:
        return Item.objects.none()

    qs = Item.objects.filter(
        owner__college_id=user.college_id,
        status=Item.STATUS_ACTIVE,
        is_published=True,
        category__is_active=True
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

from decimal import Decimal
from django.db.models import Count, Q, Exists, OuterRef, F
from django.db.models.functions import Coalesce
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.http import Http404

from apps.listings.models import Item
from apps.marketplace.models import Wishlist, Category
from apps.bookings.models import Booking
from .search_service import apply_full_text_search
from .availability_service import filter_available_items, is_item_available


def get_marketplace_items_queryset(user, params: dict):
    """
    Constructs the base marketplace queryset enforcing strict intra-campus isolation:
    Only verified resources from the student's own college are returned.
    """
    if not user or not user.is_authenticated or not user.college_id:
        return Item.objects.none()

    # Base College-isolated queryset
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

    # 1. Search Query
    search_text = params.get('search', '').strip()
    if search_text:
        qs = apply_full_text_search(qs, search_text)

    # 2. Category Filter (by slug)
    category_slug = params.get('category', '').strip().lower()
    if category_slug and category_slug != 'all':
        qs = qs.filter(category__slug=category_slug)

    # 3. Price Filter (min_price, max_price)
    min_price = params.get('min_price')
    max_price = params.get('max_price')
    if min_price is not None and str(min_price).strip() != '':
        try:
            min_val = Decimal(str(min_price))
            if min_val < 0:
                raise ValidationError("Minimum price cannot be negative.")
            qs = qs.filter(daily_rental_price__gte=min_val)
        except (ValueError, TypeError):
            raise ValidationError("Invalid min_price value.")

    if max_price is not None and str(max_price).strip() != '':
        try:
            max_val = Decimal(str(max_price))
            if max_val < 0:
                raise ValidationError("Maximum price cannot be negative.")
            if min_price is not None and str(min_price).strip() != '':
                if max_val < Decimal(str(min_price)):
                    raise ValidationError("Maximum price must be greater than or equal to minimum price.")
            qs = qs.filter(daily_rental_price__lte=max_val)
        except (ValueError, TypeError):
            raise ValidationError("Invalid max_price value.")

    # 4. Condition Filter
    condition = params.get('condition', '').strip().upper()
    if condition:
        valid_conditions = [c[0] for c in Item.CONDITION_CHOICES]
        if condition in valid_conditions:
            qs = qs.filter(condition=condition)

    # 5. Availability Filter
    availability = params.get('availability', '').strip().lower()
    available_now = availability == 'now'
    available_from = params.get('available_from') or params.get('start_date')
    available_to = params.get('available_to') or params.get('end_date')
    qs = filter_available_items(
        qs,
        available_now=available_now,
        start_date=available_from,
        end_date=available_to
    )

    # 6. Pickup Location Filter
    pickup_spot = (params.get('pickup_location') or params.get('pickup_spot') or '').strip()
    if pickup_spot:
        # Match within JSONField or string representation
        qs = qs.filter(
            Q(pickup_locations__icontains=pickup_spot)
        )

    # 7. Minimum Owner Rating Filter
    min_rating = params.get('min_owner_rating') or params.get('min_rating')
    if min_rating is not None and str(min_rating).strip() != '':
        try:
            rating_val = Decimal(str(min_rating))
            qs = qs.filter(owner__profile__reputation_as_owner__gte=rating_val)
        except (ValueError, TypeError):
            pass

    # Annotations: Wishlist status & Completed rental counts
    user_wishlist = Wishlist.objects.filter(
        user=user,
        item=OuterRef('pk')
    )
    qs = qs.annotate(
        is_wishlisted=Exists(user_wishlist),
        completed_rentals=Count('bookings', filter=Q(bookings__status=Booking.STATUS_COMPLETED), distinct=True),
        owner_score=Coalesce('owner__profile__reputation_as_owner', Decimal('5.00'))
    )

    # 8. Sorting
    sort_option = (params.get('sort') or params.get('ordering') or 'newest').strip().lower()
    if sort_option == 'popular':
        qs = qs.order_by('-completed_rentals', '-created_at')
    elif sort_option == 'price_low':
        qs = qs.order_by('daily_rental_price', '-created_at')
    elif sort_option == 'price_high':
        qs = qs.order_by('-daily_rental_price', '-created_at')
    elif sort_option == 'owner_rating':
        qs = qs.order_by('-owner_score', '-created_at')
    else:  # newest / default
        qs = qs.order_by('-created_at')

    return qs


def get_item_detail(user, item_id: str) -> dict:
    """
    Retrieves full listing detail for a resource, strictly ensuring college isolation.
    Returns Http404 if item does not exist or belongs to another institution.
    """
    try:
        item = Item.objects.select_related(
            'owner',
            'category',
            'owner__profile'
        ).prefetch_related(
            'images',
            'bookings'
        ).get(id=item_id)
    except Item.DoesNotExist:
        raise Http404("Resource item not found.")

    # College-level isolation
    if user and user.college_id and item.owner.college_id != user.college_id:
        raise Http404("Resource item not found.")

    # Status & publication check: Only the owner or staff can inspect drafts / unlisted items
    is_owner = bool(user and user.is_authenticated and user.id == item.owner_id)
    is_staff = bool(user and user.is_authenticated and user.is_staff)
    if (item.status != Item.STATUS_ACTIVE or not item.is_published) and not (is_owner or is_staff):
        raise Http404("Resource item not found.")

    # Wishlist status for the requesting student
    is_wishlisted = False
    if user and user.is_authenticated:
        is_wishlisted = Wishlist.objects.filter(user=user, item=item).exists()

    # Completed rentals count
    completed_rentals = item.bookings.filter(status=Booking.STATUS_COMPLETED).count()

    # Immediate availability flag
    currently_available = is_item_available(item)

    # Related items in same category from this college (excluding this item)
    related_items = Item.objects.filter(
        category=item.category,
        owner__college_id=item.owner.college_id,
        status=Item.STATUS_ACTIVE,
        is_published=True
    ).exclude(id=item.id).select_related('owner', 'category')[:4]

    return {
        "item": item,
        "is_wishlisted": is_wishlisted,
        "completed_rentals": completed_rentals,
        "currently_available": currently_available,
        "related_items": related_items,
        "is_own_item": bool(user and user.is_authenticated and user.id == item.owner_id),
    }

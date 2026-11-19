"""
Personalized Campus Recommendation Engine (Phase 13).
Serves personalized listings based on student rental history & wishlists.
Falls back to cold-start top-rated department picks for new students.
"""

from typing import List, Dict, Any
from django.db.models import Q
from apps.listings.models import Item
from apps.bookings.models import Booking


DEPARTMENT_CATEGORY_PREFERENCES = {
    'cse': ['electronics', 'computers', 'calculators', 'lab'],
    'computer science': ['electronics', 'computers', 'calculators', 'lab'],
    'ai': ['electronics', 'computers', 'calculators'],
    'aiml': ['electronics', 'computers', 'calculators'],
    'ece': ['electronics', 'hardware', 'calculators', 'laboratory'],
    'electronics': ['electronics', 'hardware', 'calculators', 'laboratory'],
    'mechanical': ['hardware', 'tools', 'daily-use', 'drafter'],
    'civil': ['drafter', 'tools', 'hardware'],
    'general': ['academic', 'calculators', 'books', 'electronics'],
}


def get_personalized_recommendations(user, limit: int = 10) -> Dict[str, Any]:
    """
    Returns personalized listings for a student.
    Handles cold-start using department-level popularity.
    """
    if not user or not user.is_authenticated:
        # Public anonymous fallback
        top_items = list(
            Item.objects.filter(is_published=True, status=Item.STATUS_ACTIVE)
            .select_related('category', 'owner')
            .prefetch_related('images')
            .order_by('-rental_count', '-created_at')[:limit]
        )
        return {
            'strategy': 'COLD_START_CAMPUS_POPULAR',
            'department': None,
            'recommendations': [_serialize_item(it, 'Campus Trending') for it in top_items]
        }

    # 1. Check student rental history
    past_rentals = list(
        Booking.objects.filter(renter=user)
        .exclude(status=Booking.STATUS_CANCELLED)
        .select_related('item', 'item__category')[:10]
    )

    rented_categories = [
        b.item.category.slug for b in past_rentals if b.item and b.item.category
    ]

    rented_item_ids = [str(b.item.id) for b in past_rentals if b.item]

    # 2. Check student wishlist
    wishlisted_category_slugs = []
    try:
        from apps.marketplace.models import Wishlist
        wishlist_objs = Wishlist.objects.filter(user=user).select_related('item', 'item__category')[:15]
        for w in wishlist_objs:
            if w.item:
                rented_item_ids.append(str(w.item.id))
                if w.item.category:
                    wishlisted_category_slugs.append(w.item.category.slug)
    except Exception:
        pass

    preferred_categories = set(rented_categories + wishlisted_category_slugs)

    # If student has engagement history, serve personalized recommendations
    if preferred_categories:
        personalized_qs = (
            Item.objects.filter(is_published=True, status=Item.STATUS_ACTIVE)
            .filter(category__slug__in=preferred_categories)
            .exclude(owner=user)
            .exclude(id__in=rented_item_ids)
            .select_related('category', 'owner')
            .prefetch_related('images')
            .order_by('-rental_count', '-created_at')[:limit]
        )

        items = list(personalized_qs)
        if len(items) < limit:
            # Backfill with general campus favorites
            existing_ids = set(str(it.id) for it in items) | set(rented_item_ids)
            backfill = (
                Item.objects.filter(is_published=True, status=Item.STATUS_ACTIVE)
                .exclude(owner=user)
                .exclude(id__in=existing_ids)
                .select_related('category', 'owner')
                .prefetch_related('images')
                .order_by('-created_at')[:limit - len(items)]
            )
            items.extend(list(backfill))

        return {
            'strategy': 'PERSONALIZED_HISTORY',
            'department': getattr(user, 'profile', None).department if hasattr(user, 'profile') and user.profile else None,
            'recommendations': [_serialize_item(it, 'Recommended for you') for it in items]
        }

    # 3. Cold-Start Fallback: Student Department / Year
    user_dept = ''
    try:
        if hasattr(user, 'profile') and user.profile and user.profile.department:
            user_dept = user.profile.department.strip().lower()
    except Exception:
        pass

    matched_dept_slugs = []
    for dept_key, slugs in DEPARTMENT_CATEGORY_PREFERENCES.items():
        if dept_key in user_dept:
            matched_dept_slugs.extend(slugs)
            break

    if not matched_dept_slugs:
        matched_dept_slugs = DEPARTMENT_CATEGORY_PREFERENCES['general']

    department_qs = (
        Item.objects.filter(is_published=True, status=Item.STATUS_ACTIVE)
        .exclude(owner=user)
        .filter(Q(category__slug__in=matched_dept_slugs) | Q(category__name__icontains=user_dept))
        .select_related('category', 'owner')
        .prefetch_related('images')
        .order_by('-rental_count', '-created_at')[:limit]
    )

    items = list(department_qs)
    if len(items) < limit:
        existing_ids = set(str(it.id) for it in items)
        generic_backfill = (
            Item.objects.filter(is_published=True, status=Item.STATUS_ACTIVE)
            .exclude(owner=user)
            .exclude(id__in=existing_ids)
            .select_related('category', 'owner')
            .prefetch_related('images')
            .order_by('-rental_count', '-created_at')[:limit - len(items)]
        )
        items.extend(list(generic_backfill))

    dept_display = user_dept.upper() if user_dept else 'Campus'

    return {
        'strategy': 'COLD_START_DEPARTMENT',
        'department': user_dept or 'General Academic',
        'recommendations': [_serialize_item(it, f"Top Pick for {dept_display} students") for it in items]
    }


def _serialize_item(item: Item, reason: str) -> Dict[str, Any]:
    img_url = item.primary_image_url
    if not img_url and item.images.exists():
        first_img = item.images.first()
        if first_img and hasattr(first_img, 'image') and first_img.image:
            img_url = first_img.image.url

    owner_name = item.owner.get_full_name() or item.owner.username if item.owner else "Student"

    return {
        'id': str(item.id),
        'title': item.title,
        'category_name': item.category.name if item.category else '',
        'category_slug': item.category.slug if item.category else '',
        'rental_price_per_day': float(item.rental_price_per_day),
        'security_deposit': 0.0,
        'condition': item.condition,
        'primary_image_url': img_url or '',
        'owner_name': owner_name,
        'recommendation_reason': reason,
        'is_available': (item.status == Item.STATUS_ACTIVE and item.is_published),
    }

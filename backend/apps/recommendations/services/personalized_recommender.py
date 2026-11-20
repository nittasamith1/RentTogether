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
    'cse': ['electronics', 'computers', 'calculators', 'academic', 'laboratory', 'project-equipment'],
    'computer science': ['electronics', 'computers', 'calculators', 'academic', 'laboratory', 'project-equipment'],
    'ai': ['electronics', 'academic', 'project-equipment', 'laboratory', 'computers', 'calculators'],
    'aiml': ['electronics', 'academic', 'project-equipment', 'laboratory', 'computers', 'calculators'],
    'artificial intelligence': ['electronics', 'academic', 'project-equipment', 'laboratory', 'computers'],
    'ece': ['electronics', 'hardware', 'calculators', 'laboratory', 'project-equipment'],
    'electronics': ['electronics', 'hardware', 'calculators', 'laboratory', 'project-equipment'],
    'mechanical': ['hardware', 'tools', 'daily-use', 'drafter', 'laboratory'],
    'civil': ['drafter', 'tools', 'hardware', 'laboratory'],
    'general': ['academic', 'calculators', 'books', 'electronics', 'project-equipment', 'laboratory'],
}


def _get_contextual_reason(item: Item, dept_display: str = '') -> str:
    slug = (item.category.slug if item.category else '').lower()
    title = item.title.lower()
    if 'drafter' in title or 'drawing' in title or 'drafter' in slug:
        return "Engineering Graphics Essential"
    if 'calculator' in title or 'casio' in title:
        return "AIML Core Math & Exam Gear"
    if 'arduino' in title or 'sensor' in title or 'robotics' in title or 'project' in slug:
        return "IoT & Embedded Systems Lab"
    if 'headphone' in title or 'sony' in title or 'audio' in title:
        return "Focus & Coding Headset"
    if 'lab' in slug:
        return "Campus Practical Equipment"
    if 'academic' in slug:
        return "Essential Academic Courseware"
    if 'electronic' in slug:
        return "Student Tech Pick"
    return f"Top Pick for {dept_display}" if dept_display else "Recommended for you"


def get_personalized_recommendations(user, limit: int = 10) -> Dict[str, Any]:
    """
    Returns personalized listings for a student.
    Handles cold-start using department-level popularity and campus relevance.
    """
    from apps.marketplace.models import Wishlist

    user_wishlist_ids = set()
    college_id = getattr(user, 'college_id', None) if user and user.is_authenticated else None

    if user and user.is_authenticated:
        try:
            user_wishlist_ids = set(
                str(w) for w in Wishlist.objects.filter(user=user).values_list('item_id', flat=True)
            )
        except Exception:
            pass

    base_qs = Item.objects.filter(is_published=True, status=Item.STATUS_ACTIVE)
    if college_id:
        base_qs = base_qs.filter(owner__college_id=college_id)

    if not user or not user.is_authenticated:
        # Public anonymous fallback
        top_items = list(
            base_qs
            .select_related('category', 'owner')
            .prefetch_related('images')
            .order_by('-rental_count', '-created_at')[:limit]
        )
        return {
            'strategy': 'COLD_START_CAMPUS_POPULAR',
            'department': None,
            'recommendations': [_serialize_item(it, _get_contextual_reason(it, 'Campus'), False) for it in top_items]
        }

    # Exclude owner's own items
    base_qs = base_qs.exclude(owner=user)

    # 1. Check student rental history
    past_rentals = list(
        Booking.objects.filter(renter=user)
        .exclude(status=Booking.STATUS_CANCELLED)
        .select_related('item', 'item__category')[:10]
    )

    rented_categories = [
        b.item.category.slug for b in past_rentals if b.item and b.item.category
    ]

    # 2. Check student wishlist
    wishlisted_category_slugs = []
    try:
        wishlist_objs = Wishlist.objects.filter(user=user).select_related('item', 'item__category')[:15]
        for w in wishlist_objs:
            if w.item and w.item.category:
                wishlisted_category_slugs.append(w.item.category.slug)
    except Exception:
        pass

    preferred_categories = set(rented_categories + wishlisted_category_slugs)

    # 3. Department
    user_dept = ''
    try:
        if hasattr(user, 'profile') and user.profile and user.profile.department:
            user_dept = user.profile.department.strip()
    except Exception:
        pass

    dept_display = user_dept or 'Campus'
    matched_dept_slugs = []
    for dept_key, slugs in DEPARTMENT_CATEGORY_PREFERENCES.items():
        if dept_key in user_dept.lower():
            matched_dept_slugs.extend(slugs)
            break

    if not matched_dept_slugs:
        matched_dept_slugs = DEPARTMENT_CATEGORY_PREFERENCES['general']

    all_target_categories = set(preferred_categories) | set(matched_dept_slugs)

    # Fetch targeted items
    targeted_items = list(
        base_qs.filter(category__slug__in=all_target_categories)
        .select_related('category', 'owner')
        .prefetch_related('images')
        .order_by('-rental_count', '-created_at')[:limit]
    )

    # Backfill with other active campus equipment if needed
    items = targeted_items
    if len(items) < limit:
        existing_ids = set(str(it.id) for it in items)
        backfill = list(
            base_qs.exclude(id__in=existing_ids)
            .select_related('category', 'owner')
            .prefetch_related('images')
            .order_by('-rental_count', '-created_at')[:limit - len(items)]
        )
        items.extend(backfill)

    return {
        'strategy': 'COLD_START_DEPARTMENT' if not preferred_categories else 'PERSONALIZED_HISTORY',
        'department': dept_display,
        'recommendations': [
            _serialize_item(
                it,
                _get_contextual_reason(it, dept_display),
                is_wishlisted=(str(it.id) in user_wishlist_ids)
            )
            for it in items
        ]
    }


def _serialize_item(item: Item, reason: str, is_wishlisted: bool = False) -> Dict[str, Any]:
    img_url = item.primary_image_url
    if not img_url:
        first_img = item.images.first()
        if first_img:
            img_url = getattr(first_img, 'image_url', '') or (first_img.image.url if hasattr(first_img, 'image') and first_img.image else '')

    owner_name = item.owner.get_full_name() or item.owner.email.split('@')[0] if item.owner else "Student"

    return {
        'id': str(item.id),
        'title': item.title,
        'category_name': item.category.name if item.category else '',
        'category_slug': item.category.slug if item.category else '',
        'rental_price_per_day': float(item.rental_price_per_day),
        'security_deposit': 0.0,
        'condition': item.condition,
        'primary_image_url': img_url or '',
        'owner_id': str(item.owner_id) if item.owner_id else '',
        'owner_name': owner_name,
        'recommendation_reason': reason,
        'is_available': (item.status == Item.STATUS_ACTIVE and item.is_published),
        'is_wishlisted': is_wishlisted,
    }

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.http import Http404
from apps.listings.models import Item
from django.db.models import Q
from apps.marketplace.models import Wishlist


def add_to_wishlist(user, item_id: str) -> tuple[Wishlist, bool]:
    """
    Adds an item to the authenticated student's wishlist.
    Enforces college isolation, self-wishlist prevention, and published status.
    """
    try:
        item = Item.objects.select_related('owner', 'category').get(id=item_id)
    except Item.DoesNotExist:
        raise Http404("Item not found.")

    # College isolation: student cannot access items from another college
    if item.owner.college_id != user.college_id:
        raise Http404("Item not found.")

    # Business rule: Students cannot wishlist their own listings
    if item.owner_id == user.id:
        raise ValidationError("You cannot add your own listed resource to your wishlist.")

    # Business rule: Only active, published items can be wishlisted
    if item.status != Item.STATUS_ACTIVE or not item.is_published:
        raise ValidationError("This item is currently unavailable and cannot be wishlisted.")

    # Business rule: Items with active owner booking blocks cannot be wishlisted
    from django.utils import timezone
    from apps.availability.models import ItemAvailabilityBlock
    has_active_owner_block = ItemAvailabilityBlock.objects.filter(
        item=item,
        reason__in=[ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE, ItemAvailabilityBlock.REASON_MAINTENANCE],
        end_date__gt=timezone.now().date()
    ).exists()
    if has_active_owner_block:
        raise ValidationError("This item is currently blocked by the owner and cannot be wishlisted.")

    wishlist_entry, created = Wishlist.objects.get_or_create(
        user=user,
        item=item
    )
    return wishlist_entry, created


def remove_from_wishlist(user, item_id: str) -> bool:
    """
    Removes an item from the authenticated student's wishlist.
    Safe against repeated requests.
    """
    deleted_count, _ = Wishlist.objects.filter(user=user, item_id=item_id).delete()
    return deleted_count > 0


def clear_user_wishlist(user) -> int:
    """
    Permanently deletes all saved wishlist items for the authenticated student,
    reclaiming database storage.
    """
    deleted_count, _ = Wishlist.objects.filter(user=user).delete()
    return deleted_count


def get_user_wishlist_items(user, search=None):
    """
    Returns items saved by the student, enforcing college isolation and search.
    """
    qs = Item.objects.filter(
        wishlist_entries__user=user,
        owner__college_id=user.college_id,
        is_published=True
    ).select_related('owner', 'category', 'owner__profile').prefetch_related('images').order_by('-wishlist_entries__created_at')

    if search and search.strip():
        terms = search.strip().split()
        search_q = Q()
        for term in terms:
            term_q = (
                Q(title__icontains=term) |
                Q(description__icontains=term) |
                Q(brand__icontains=term) |
                Q(model_name__icontains=term) |
                Q(category__name__icontains=term)
            )
            search_q &= term_q
        qs = qs.filter(search_q)

    return qs


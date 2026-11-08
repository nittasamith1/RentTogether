from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.db import transaction
from django.db.models import Q, Count
from django.core.exceptions import ValidationError, PermissionDenied
from django.http import Http404
from django.utils import timezone

from apps.listings.models import Item, ItemImage
from apps.marketplace.models import Category
from apps.bookings.models import Booking
from apps.listings.services.image_service import process_and_save_item_images

CONFLICTING_BOOKING_STATUSES = [Booking.STATUS_APPROVED, Booking.STATUS_ACTIVE]


def verify_student_eligibility(user) -> None:
    """
    Validates that the student is authenticated, email-verified, and college-verified.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication is required.")
    if not getattr(user, 'email_verified', False):
        raise PermissionDenied("Institutional email address must be verified before listing equipment.")
    if not getattr(user, 'is_college_verified', False):
        raise PermissionDenied("Campus student verification is required before listing equipment.")
    if not getattr(user, 'college_id', None):
        raise PermissionDenied("Student must be assigned to an active college tenant.")


def create_listing(owner, data: Dict[str, Any], image_files: Optional[List[Any]] = None) -> Item:
    """
    Creates and publishes a new resource listing in the student's campus marketplace.
    Wrapped in an atomic transaction to ensure DB integrity across items and images.
    """
    verify_student_eligibility(owner)

    if not image_files or len(image_files) == 0:
        raise ValidationError({"images": "At least one photograph is required to publish a resource listing."})
    if len(image_files) > 5:
        raise ValidationError({"images": "A maximum of 5 photographs can be uploaded per listing."})

    # Validate category
    category_id = data.get('category_id') or data.get('category')
    try:
        if isinstance(category_id, Category):
            category = category_id
        else:
            category = Category.objects.get(id=category_id)
        if not category.is_active:
            raise ValidationError({"category": "Selected category is currently inactive."})
    except (Category.DoesNotExist, ValueError):
        raise ValidationError({"category": "Valid active category selection is required."})

    with transaction.atomic():
        item = Item(
            owner=owner,
            category=category,
            title=data.get('title', '').strip(),
            description=data.get('description', '').strip(),
            brand=data.get('brand', '').strip(),
            model_name=data.get('model_name', '').strip(),
            original_price=data.get('original_price') or data.get('original_purchase_price', Decimal('0.00')),
            item_age_months=int(data.get('item_age_months', 0)),
            purchase_date=data.get('purchase_date'),
            condition=data.get('condition', Item.CONDITION_GOOD),
            rental_price_per_day=data.get('rental_price_per_day') or data.get('daily_rental_price', Decimal('10.00')),
            security_deposit=data.get('security_deposit', Decimal('0.00')),
            min_rental_days=int(data.get('min_rental_days', 1)),
            max_rental_days=int(data.get('max_rental_days', 30)),
            pickup_location=data.get('pickup_location', '').strip(),
            pickup_instructions=data.get('pickup_instructions', '').strip(),
            status=Item.STATUS_ACTIVE,
            published_at=timezone.now(),
        )

        item.clean()
        item.save()

        # Upload and link photographs
        process_and_save_item_images(item, image_files)

    return item


def get_owner_listings(owner, filters: Optional[Dict[str, Any]] = None):
    """
    Retrieves all equipment listings belonging to the authenticated student.
    Includes active booking counts and supports search, category, and status filtering.
    """
    verify_student_eligibility(owner)

    qs = Item.objects.filter(owner=owner).select_related('category').prefetch_related('images')

    if not filters:
        filters = {}

    status_filter = filters.get('status', '').strip().upper()
    if status_filter in [Item.STATUS_ACTIVE, Item.STATUS_PAUSED, Item.STATUS_REMOVED]:
        qs = qs.filter(status=status_filter)
    else:
        # Exclude soft-deleted items by default unless explicitly requested
        qs = qs.exclude(status=Item.STATUS_REMOVED)

    category_slug = filters.get('category', '').strip().lower()
    if category_slug:
        qs = qs.filter(category__slug=category_slug)

    search_query = filters.get('search', '').strip()
    if search_query:
        qs = qs.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(brand__icontains=search_query) |
            Q(model_name__icontains=search_query)
        )

    # Annotate active bookings count
    qs = qs.annotate(
        active_bookings_count=Count(
            'bookings',
            filter=Q(bookings__status__in=CONFLICTING_BOOKING_STATUSES),
            distinct=True
        ),
        completed_bookings_count=Count(
            'bookings',
            filter=Q(bookings__status=Booking.STATUS_COMPLETED),
            distinct=True
        )
    )

    return qs.order_by('-created_at')


def get_owner_listing_detail(owner, item_id: str) -> Item:
    """
    Retrieves a single listing belonging to the owner for management.
    Raises Http404 if item does not exist or belongs to another student.
    """
    try:
        item = Item.objects.select_related(
            'category', 'owner'
        ).prefetch_related(
            'images', 'bookings'
        ).get(id=item_id)
    except Item.DoesNotExist:
        raise Http404("Listing not found.")

    if item.owner_id != owner.id:
        raise Http404("Listing not found.")

    return item


def update_listing(owner, item_id: str, data: Dict[str, Any]) -> Item:
    """
    Updates editable fields of a resource listing.
    Protects existing bookings from price alteration or commitment invalidation.
    """
    item = get_owner_listing_detail(owner, item_id)

    # Check for active bookings
    has_active_bookings = item.bookings.filter(status__in=CONFLICTING_BOOKING_STATUSES).exists()

    # Updatable fields
    editable_fields = [
        'title', 'description', 'brand', 'model_name', 'condition',
        'original_price', 'item_age_months', 'purchase_date',
        'min_rental_days', 'max_rental_days', 'pickup_location',
        'pickup_instructions'
    ]

    for field in editable_fields:
        if field in data and data[field] is not None:
            setattr(item, field, data[field])

    # Category update
    if 'category_id' in data:
        try:
            new_cat = Category.objects.get(id=data['category_id'], is_active=True)
            item.category = new_cat
        except Category.DoesNotExist:
            raise ValidationError({"category": "Selected category is not valid or active."})

    # Pricing & Deposit updates apply to future bookings
    if 'rental_price_per_day' in data and data['rental_price_per_day'] is not None:
        item.rental_price_per_day = data['rental_price_per_day']
    if 'security_deposit' in data and data['security_deposit'] is not None:
        item.security_deposit = data['security_deposit']

    item.clean()
    item.save()
    return item


def set_listing_status(owner, item_id: str, target_status: str) -> Item:
    """
    Transitions listing status between ACTIVE and PAUSED.
    Does not cancel or impact existing confirmed bookings.
    """
    item = get_owner_listing_detail(owner, item_id)
    norm_status = target_status.strip().upper()

    if norm_status not in [Item.STATUS_ACTIVE, Item.STATUS_PAUSED]:
        raise ValidationError({"status": f"Invalid status '{target_status}'. Allowed transitions: ACTIVE, PAUSED."})

    if item.status == Item.STATUS_REMOVED:
        raise ValidationError({"status": "Removed listings cannot be paused or resumed."})

    item.status = norm_status
    item.save(update_fields=['status', 'is_published', 'updated_at'])
    return item


def soft_delete_listing(owner, item_id: str) -> Item:
    """
    Soft-deletes a listing by setting status to REMOVED.
    Preserves all historical booking, financial, and review records.
    """
    item = get_owner_listing_detail(owner, item_id)

    if item.status == Item.STATUS_REMOVED:
        return item

    item.status = Item.STATUS_REMOVED
    item.removed_at = timezone.now()
    item.is_published = False
    item.save(update_fields=['status', 'removed_at', 'is_published', 'updated_at'])
    return item


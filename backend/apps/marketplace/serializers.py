from rest_framework import serializers
from apps.marketplace.models import Category, Wishlist
from apps.listings.models import Item, ItemImage
from apps.profiles.services.reputation_service import calculate_owner_reputation, get_reputation_badge
from apps.marketplace.services.availability_service import is_item_available


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for marketplace categories, including the number of eligible items
    available within the requesting student's college.
    """
    eligible_item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon_name',
            'image_url',
            'display_order',
            'eligible_item_count',
        ]

    def get_eligible_item_count(self, obj) -> int:
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.college_id:
            from django.utils import timezone
            from apps.availability.models import ItemAvailabilityBlock

            today = timezone.now().date()
            owner_blocked_item_ids = ItemAvailabilityBlock.objects.filter(
                reason__in=[
                    ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
                    ItemAvailabilityBlock.REASON_MAINTENANCE
                ],
                end_date__gt=today
            ).values_list('item_id', flat=True)

            return obj.items.filter(
                owner__college_id=request.user.college_id,
                status=Item.STATUS_ACTIVE,
                is_published=True
            ).exclude(
                owner_id=request.user.id
            ).exclude(
                id__in=owner_blocked_item_ids
            ).count()
        return 0


class ItemImageSerializer(serializers.ModelSerializer):
    """
    Gallery photo serializer.
    """
    class Meta:
        model = ItemImage
        fields = ['id', 'image_url', 'is_primary', 'display_order']


class OwnerPublicSummarySerializer(serializers.Serializer):
    """
    Public sanitized owner profile information for rental decisions.
    Strictly excludes sensitive phone, email, roll number, and private assets.
    """
    id = serializers.UUIDField(source='user.id')
    display_name = serializers.CharField(source='user.get_full_name')
    avatar = serializers.SerializerMethodField()
    reputation = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    department = serializers.CharField(default='')
    year_of_study = serializers.IntegerField(default=1)

    def get_avatar(self, obj) -> str:
        return getattr(obj, 'avatar_url', '')

    def get_reputation(self, obj) -> float:
        score, _ = calculate_owner_reputation(obj.user_id)
        return float(score) if score is not None else 5.0

    def get_badge(self, obj) -> str:
        score, count = calculate_owner_reputation(obj.user_id)
        return get_reputation_badge(score, count)

    def get_review_count(self, obj) -> int:
        _, count = calculate_owner_reputation(obj.user_id)
        return count


class MarketplaceItemSummarySerializer(serializers.ModelSerializer):
    """
    Summary serializer for marketplace cards and search result grids.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_icon = serializers.CharField(source='category.icon_name', read_only=True)
    short_description = serializers.SerializerMethodField()
    availability_status = serializers.SerializerMethodField()
    completed_rental_count = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    hourly_rental_price = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id',
            'title',
            'short_description',
            'primary_image_url',
            'category_name',
            'category_slug',
            'category_icon',
            'condition',
            'brand',
            'model_name',
            'daily_rental_price',
            'hourly_rental_price',
            'security_deposit',
            'availability_status',
            'completed_rental_count',
            'is_wishlisted',
            'pickup_locations',
            'owner',
            'created_at',
        ]

    def get_hourly_rental_price(self, obj) -> str:
        from decimal import Decimal
        daily = obj.rental_price_per_day
        if daily:
            return str((Decimal(str(daily)) / Decimal('24')).quantize(Decimal('0.01')))
        return "0.00"

    def get_short_description(self, obj) -> str:
        desc = obj.description or ''
        return desc[:120] + ('...' if len(desc) > 120 else '')

    def get_availability_status(self, obj) -> str:
        available = is_item_available(obj)
        return "AVAILABLE" if available else "RENTED"

    def get_completed_rental_count(self, obj) -> int:
        if hasattr(obj, 'completed_rentals'):
            return obj.completed_rentals
        return obj.bookings.filter(status='COMPLETED').count()

    def get_is_wishlisted(self, obj) -> bool:
        if hasattr(obj, 'is_wishlisted'):
            return bool(obj.is_wishlisted)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, item=obj).exists()
        return False

    def get_owner(self, obj) -> dict:
        profile = getattr(obj.owner, 'profile', None)
        verification = getattr(obj.owner, 'verification', None)
        score, count = calculate_owner_reputation(obj.owner_id)
        badge = get_reputation_badge(score, count)
        dept = (getattr(profile, 'department', '') or getattr(verification, 'department', ''))
        year = (getattr(profile, 'year_of_study', 1) or getattr(verification, 'year_of_study', 1))
        display_name = obj.owner.get_full_name() or obj.owner.username or "Student"
        return {
            "id": str(obj.owner.id),
            "display_name": display_name,
            "avatar": getattr(profile, 'avatar_url', ''),
            "reputation": float(score) if score is not None else 5.0,
            "badge": badge,
            "review_count": count,
            "department": dept,
            "year_of_study": year,
        }


class MarketplaceItemDetailSerializer(MarketplaceItemSummarySerializer):
    """
    Comprehensive serializer for single resource inspection.
    Includes gallery images, full specs, rental duration, and related resources.
    """
    images = ItemImageSerializer(many=True, read_only=True)
    related_items = serializers.SerializerMethodField()
    is_own_item = serializers.SerializerMethodField()

    class Meta(MarketplaceItemSummarySerializer.Meta):
        fields = MarketplaceItemSummarySerializer.Meta.fields + [
            'description',
            'original_purchase_price',
            'min_rental_days',
            'max_rental_days',
            'images',
            'related_items',
            'is_own_item',
        ]

    def get_related_items(self, obj):
        related_qs = self.context.get('related_items', [])
        return MarketplaceItemSummarySerializer(related_qs, many=True, context=self.context).data

    def get_is_own_item(self, obj) -> bool:
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return request.user.id == obj.owner_id
        return False


class WishlistEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for items in the student's personal wishlist.
    """
    item = MarketplaceItemSummarySerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'item', 'created_at']

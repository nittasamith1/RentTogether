from decimal import Decimal
from rest_framework import serializers
from apps.listings.models import Item, ItemImage
from apps.marketplace.models import Category
from apps.marketplace.serializers import CategorySerializer


class ItemImageListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemImage
        fields = [
            'id',
            'image_url',
            'cloudinary_public_id',
            'is_primary',
            'display_order',
            'created_at',
        ]


class CreateListingSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=150)
    description = serializers.CharField(max_length=2000)
    category_id = serializers.UUIDField()
    brand = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    model_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    item_age_months = serializers.IntegerField(min_value=0, default=0, required=False)
    purchase_date = serializers.DateField(required=False, allow_null=True)
    condition = serializers.ChoiceField(choices=Item.CONDITION_CHOICES, default=Item.CONDITION_GOOD)
    rental_price_per_day = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal('0.01'))
    security_deposit = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal('0.00'), default=Decimal('0.00'), required=False)
    min_rental_days = serializers.IntegerField(min_value=1, default=1, required=False)
    max_rental_days = serializers.IntegerField(min_value=1, default=30, required=False)
    pickup_location = serializers.CharField(max_length=150)
    pickup_instructions = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")

    def validate(self, attrs):
        min_days = attrs.get('min_rental_days', 1)
        max_days = attrs.get('max_rental_days', 30)
        if max_days < min_days:
            raise serializers.ValidationError({"max_rental_days": "Maximum rental duration must be greater than or equal to minimum rental duration."})
        return attrs


class UpdateListingSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=150, required=False)
    description = serializers.CharField(max_length=2000, required=False)
    category_id = serializers.UUIDField(required=False)
    brand = serializers.CharField(max_length=100, required=False, allow_blank=True)
    model_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), required=False)
    item_age_months = serializers.IntegerField(min_value=0, required=False)
    purchase_date = serializers.DateField(required=False, allow_null=True)
    condition = serializers.ChoiceField(choices=Item.CONDITION_CHOICES, required=False)
    rental_price_per_day = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal('0.01'), required=False)
    security_deposit = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal('0.00'), required=False)
    min_rental_days = serializers.IntegerField(min_value=1, required=False)
    max_rental_days = serializers.IntegerField(min_value=1, required=False)
    pickup_location = serializers.CharField(max_length=150, required=False)
    pickup_instructions = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, attrs):
        min_days = attrs.get('min_rental_days')
        max_days = attrs.get('max_rental_days')
        if min_days is not None and max_days is not None and max_days < min_days:
            raise serializers.ValidationError({"max_rental_days": "Maximum rental duration must be greater than or equal to minimum rental duration."})
        return attrs


class OwnerListingSummarySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    active_bookings_count = serializers.IntegerField(default=0, read_only=True)
    completed_bookings_count = serializers.IntegerField(default=0, read_only=True)
    hourly_rental_price = serializers.SerializerMethodField()
    security_deposit = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id',
            'title',
            'primary_image_url',
            'category_name',
            'category_slug',
            'condition',
            'rental_price_per_day',
            'hourly_rental_price',
            'security_deposit',
            'status',
            'rental_count',
            'active_bookings_count',
            'completed_bookings_count',
            'pickup_location',
            'published_at',
            'created_at',
        ]

    def get_security_deposit(self, obj) -> str:
        return "0.00"

    def get_hourly_rental_price(self, obj) -> str:
        if obj.rental_price_per_day:
            return str((Decimal(str(obj.rental_price_per_day)) / Decimal('24')).quantize(Decimal('0.01')))
        return "0.00"


class OwnerListingDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ItemImageListingSerializer(many=True, read_only=True)
    active_bookings_count = serializers.SerializerMethodField()
    completed_bookings_count = serializers.SerializerMethodField()
    hourly_rental_price = serializers.SerializerMethodField()
    security_deposit = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id',
            'title',
            'description',
            'brand',
            'model_name',
            'category',
            'condition',
            'original_price',
            'item_age_months',
            'purchase_date',
            'rental_price_per_day',
            'hourly_rental_price',
            'security_deposit',
            'min_rental_days',
            'max_rental_days',
            'pickup_location',
            'pickup_instructions',
            'status',
            'is_published',
            'primary_image_url',
            'rental_count',
            'active_bookings_count',
            'completed_bookings_count',
            'published_at',
            'removed_at',
            'created_at',
            'updated_at',
            'images',
        ]

    def get_security_deposit(self, obj) -> str:
        return "0.00"

    def get_hourly_rental_price(self, obj) -> str:
        if obj.rental_price_per_day:
            return str((Decimal(str(obj.rental_price_per_day)) / Decimal('24')).quantize(Decimal('0.01')))
        return "0.00"

    def get_active_bookings_count(self, obj) -> int:
        if hasattr(obj, 'active_bookings_count'):
            return obj.active_bookings_count
        return obj.bookings.filter(status__in=['APPROVED', 'ACTIVE']).count()

    def get_completed_bookings_count(self, obj) -> int:
        if hasattr(obj, 'completed_bookings_count'):
            return obj.completed_bookings_count
        return obj.bookings.filter(status='COMPLETED').count()


class PriceRecommendationRequestSerializer(serializers.Serializer):
    category = serializers.CharField(max_length=100)
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    condition = serializers.ChoiceField(choices=Item.CONDITION_CHOICES, default=Item.CONDITION_GOOD)
    item_age_months = serializers.IntegerField(min_value=0, default=0, required=False)
    requested_duration_days = serializers.IntegerField(min_value=1, default=1, required=False)


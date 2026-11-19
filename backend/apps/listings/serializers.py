from decimal import Decimal
from rest_framework import serializers
from apps.listings.models import Item, ItemImage
from apps.marketplace.models import Category
from apps.marketplace.serializers import CategorySerializer


def format_media_url(url: str, request=None) -> str:
    if not url:
        return ""
    if url.startswith(('http://', 'https://', 'data:', 'blob:')):
        return url
    if request:
        return request.build_absolute_uri(url)
    return url


class ItemImageListingSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

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

    def get_image_url(self, obj) -> str:
        request = self.context.get('request')
        return format_media_url(obj.image_url, request)


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
    primary_image_url = serializers.SerializerMethodField()

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

    def get_primary_image_url(self, obj) -> str:
        request = self.context.get('request')
        url = obj.primary_image_url
        if not url:
            first_img = obj.images.filter(is_primary=True).first() or obj.images.first()
            if first_img:
                url = first_img.image_url
        return format_media_url(url, request)

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
    primary_image_url = serializers.SerializerMethodField()

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

    def get_primary_image_url(self, obj) -> str:
        request = self.context.get('request')
        url = obj.primary_image_url
        if not url:
            first_img = obj.images.filter(is_primary=True).first() or obj.images.first()
            if first_img:
                url = first_img.image_url
        return format_media_url(url, request)


class PriceRecommendationRequestSerializer(serializers.Serializer):
    category = serializers.CharField(max_length=100, required=False, allow_blank=True)
    category_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), required=False)
    original_retail_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), required=False)
    condition = serializers.ChoiceField(choices=Item.CONDITION_CHOICES, default=Item.CONDITION_GOOD, required=False)
    item_age_months = serializers.IntegerField(min_value=0, default=0, required=False)
    age_in_months = serializers.IntegerField(min_value=0, default=0, required=False)
    age_months = serializers.IntegerField(min_value=0, default=0, required=False)
    item_brand_tier = serializers.ChoiceField(choices=["BUDGET", "MID_TIER", "PREMIUM"], default="MID_TIER", required=False)
    campus_demand_score = serializers.FloatField(min_value=1.0, max_value=5.0, default=3.0, required=False)
    requested_duration_days = serializers.IntegerField(min_value=1, default=1, required=False)
    rental_duration_days = serializers.IntegerField(min_value=1, default=1, required=False)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), required=False)

    def validate(self, attrs):
        # Resolve category
        category = attrs.get('category')
        category_id = attrs.get('category_id')
        if not category and not category_id:
            raise serializers.ValidationError({"category": "Either category or category_id must be provided."})

        if not category and category_id:
            from apps.marketplace.models import Category
            try:
                cat_obj = Category.objects.filter(id=category_id).first()
                attrs['category'] = cat_obj.slug if cat_obj else str(category_id)
            except Exception:
                attrs['category'] = str(category_id)

        # Resolve price
        price = attrs.get('original_price') or attrs.get('original_retail_price')
        if not price or price <= 0:
            raise serializers.ValidationError({"original_price": "Original purchase price must be greater than zero."})
        attrs['original_price'] = price

        # Resolve age
        age = attrs.get('item_age_months') or attrs.get('age_in_months') or attrs.get('age_months') or 0
        attrs['item_age_months'] = age
        attrs['age_months'] = age

        # Resolve duration
        duration = attrs.get('rental_duration_days') or attrs.get('requested_duration_days') or 1
        attrs['rental_duration_days'] = duration
        attrs['requested_duration_days'] = duration

        return attrs


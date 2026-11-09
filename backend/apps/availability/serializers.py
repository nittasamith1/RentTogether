from rest_framework import serializers
from django.utils import timezone
from apps.availability.models import ItemAvailabilityBlock
from apps.listings.models import Item


class ItemAvailabilityPublicSerializer(serializers.ModelSerializer):
    """
    Public serializer for item availability on marketplace/item details.
    Omits private renter, booking, and monetary details for intra-campus privacy.
    """
    is_owner_block = serializers.SerializerMethodField()

    class Meta:
        model = ItemAvailabilityBlock
        fields = ['id', 'start_date', 'end_date', 'start_datetime', 'end_datetime', 'reason', 'is_owner_block']

    def get_is_owner_block(self, obj) -> bool:
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.item.owner_id == request.user.id
        return False


class CreateManualBlockSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=True)
    reason = serializers.ChoiceField(
        choices=[
            ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE,
            ItemAvailabilityBlock.REASON_MAINTENANCE
        ],
        default=ItemAvailabilityBlock.REASON_OWNER_UNAVAILABLE
    )

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if start_date >= end_date:
            raise serializers.ValidationError({
                'end_date': "End date must be strictly after start date (half-open interval [start_date, end_date))."
            })

        today = timezone.now().date()
        if start_date < today:
            raise serializers.ValidationError({
                'start_date': "Cannot create availability blocks for past dates."
            })

        return attrs


class CheckAvailabilityQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    start_datetime = serializers.DateTimeField(required=False)
    end_datetime = serializers.DateTimeField(required=False)

    def validate(self, attrs):
        s_dt = attrs.get('start_datetime')
        e_dt = attrs.get('end_datetime')
        s_d = attrs.get('start_date')
        e_d = attrs.get('end_date')

        if s_dt and e_dt:
            if s_dt >= e_dt:
                raise serializers.ValidationError({
                    'end_datetime': "End time must be strictly after start time."
                })
        elif s_d and e_d:
            if s_d > e_d:
                raise serializers.ValidationError({
                    'end_date': "End date must be on or after start date."
                })
        elif not s_d and not s_dt:
            raise serializers.ValidationError("Either (start_datetime, end_datetime) or (start_date, end_date) must be provided.")
        return attrs


class OwnerCalendarBlockSerializer(serializers.ModelSerializer):
    item_title = serializers.CharField(source='item.title', read_only=True)
    item_thumbnail = serializers.SerializerMethodField()
    booking_id = serializers.SerializerMethodField()

    class Meta:
        model = ItemAvailabilityBlock
        fields = [
            'id',
            'item_id',
            'item_title',
            'item_thumbnail',
            'start_date',
            'end_date',
            'reason',
            'booking_id',
            'expires_at',
            'created_at'
        ]

    def get_item_thumbnail(self, obj):
        primary_img = obj.item.images.filter(is_primary=True).first() or obj.item.images.first()
        return primary_img.image_url if primary_img else None

    def get_booking_id(self, obj):
        return str(obj.booking_reference_id) if obj.booking_reference_id else None


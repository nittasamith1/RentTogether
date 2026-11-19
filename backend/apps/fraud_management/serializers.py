from rest_framework import serializers
from apps.fraud_management.models import FraudAlert
from apps.listings.models import Item
from apps.accounts.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'display_name', 'is_college_verified']

    def get_display_name(self, obj):
        return obj.get_full_name() or obj.email


class ItemBasicSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'title', 'category_name', 'rental_price_per_day',
            'security_deposit', 'condition', 'is_published', 'status',
            'primary_image_url'
        ]


class FraudAlertSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    listing = ItemBasicSerializer(read_only=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True)

    class Meta:
        model = FraudAlert
        fields = [
            'id', 'listing', 'user', 'risk_score', 'risk_level',
            'trigger_signals', 'status', 'review_notes',
            'reviewed_by_email', 'reviewed_at', 'created_at', 'updated_at'
        ]


class FraudAlertActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVE', 'DISMISS', 'QUARANTINE', 'TAKE_ACTION'])
    notes = serializers.CharField(required=False, allow_blank=True, default='')


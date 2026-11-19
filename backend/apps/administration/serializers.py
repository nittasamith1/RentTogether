from decimal import Decimal
from rest_framework import serializers
from apps.administration.models import Dispute
from apps.bookings.models import Booking


class DisputeSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.SerializerMethodField()
    against_user_name = serializers.SerializerMethodField()
    booking_code = serializers.CharField(source='booking.booking_code', read_only=True)
    item_title = serializers.CharField(source='booking.item_title', read_only=True)
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Dispute
        fields = [
            'id',
            'booking',
            'booking_code',
            'item_title',
            'raised_by',
            'raised_by_name',
            'against_user',
            'against_user_name',
            'issue_type',
            'description',
            'evidence_image_urls',
            'claimed_compensation',
            'status',
            'resolution_decision',
            'admin_notes',
            'resolved_by',
            'resolved_by_name',
            'resolved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'raised_by',
            'against_user',
            'status',
            'resolution_decision',
            'admin_notes',
            'resolved_by',
            'resolved_at',
            'created_at',
            'updated_at',
        ]

    def get_raised_by_name(self, obj) -> str:
        name = f"{obj.raised_by.first_name} {obj.raised_by.last_name}".strip()
        return name or obj.raised_by.email

    def get_against_user_name(self, obj) -> str:
        name = f"{obj.against_user.first_name} {obj.against_user.last_name}".strip()
        return name or obj.against_user.email

    def get_resolved_by_name(self, obj) -> str | None:
        if not obj.resolved_by:
            return None
        name = f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}".strip()
        return name or obj.resolved_by.email


class CreateDisputeSerializer(serializers.ModelSerializer):
    booking_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Dispute
        fields = [
            'booking_id',
            'issue_type',
            'description',
            'evidence_image_urls',
            'claimed_compensation',
        ]

    def validate(self, attrs):
        booking_id = attrs.get('booking_id')
        user = self.context['request'].user
        try:
            booking = Booking.objects.select_related('renter', 'owner').get(id=booking_id)
        except Booking.DoesNotExist:
            raise serializers.ValidationError({"booking_id": "Booking not found."})

        if user not in (booking.renter, booking.owner):
            raise serializers.ValidationError({"booking_id": "You are not an authorized party for this rental agreement."})

        attrs['booking'] = booking
        attrs['raised_by'] = user
        attrs['against_user'] = booking.owner if user == booking.renter else booking.renter
        return attrs

    def create(self, validated_data):
        validated_data.pop('booking_id', None)
        return Dispute.objects.create(**validated_data)


class ResolveDisputeSerializer(serializers.Serializer):
    resolution_decision = serializers.ChoiceField(choices=Dispute.DECISION_CHOICES)
    admin_notes = serializers.CharField(required=True, allow_blank=False)
    refund_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('0.00'))


class VerifyStudentActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVE', 'REJECT'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')

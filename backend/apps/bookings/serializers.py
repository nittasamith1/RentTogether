from datetime import timedelta
from rest_framework import serializers
from apps.bookings.models import Booking, BookingStatusHistory


class BookingStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BookingStatusHistory
        fields = [
            'id',
            'previous_status',
            'new_status',
            'changed_by_name',
            'reason',
            'metadata',
            'created_at'
        ]

    def get_changed_by_name(self, obj) -> str:
        if not obj.changed_by:
            return "System Engine"
        return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip() or obj.changed_by.email


class CreateBookingRequestSerializer(serializers.Serializer):
    item_id = serializers.UUIDField(required=True)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    start_datetime = serializers.DateTimeField(required=False)
    end_datetime = serializers.DateTimeField(required=False)
    pickup_spot = serializers.CharField(required=False, allow_blank=True, max_length=150)

    def validate(self, attrs):
        s_dt = attrs.get('start_datetime')
        e_dt = attrs.get('end_datetime')
        s_d = attrs.get('start_date')
        e_d = attrs.get('end_date')

        if s_dt and e_dt:
            if s_dt >= e_dt:
                raise serializers.ValidationError({
                    'end_datetime': 'End time must be strictly after start time (half-open interval [start_datetime, end_datetime)).'
                })
            if s_d and e_d and s_d >= e_d:
                attrs['end_date'] = s_d + timedelta(days=1)
        elif s_d and e_d:
            if s_d > e_d:
                raise serializers.ValidationError({
                    'end_date': 'End date must be on or after start date.'
                })
            elif s_d == e_d:
                attrs['end_date'] = s_d + timedelta(days=1)
        else:
            raise serializers.ValidationError('Either (start_datetime, end_datetime) or (start_date, end_date) must be provided.')

        return attrs


class BookingSummarySerializer(serializers.ModelSerializer):
    item_thumbnail = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    renter_name = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    has_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id',
            'booking_code',
            'booking_reference',
            'item_id',
            'item_title',
            'item_thumbnail',
            'owner_id',
            'owner_name',
            'renter_id',
            'renter_name',
            'user_role',
            'start_date',
            'end_date',
            'start_datetime',
            'end_datetime',
            'total_days',
            'total_duration_hours',
            'daily_rate',
            'hourly_rate',
            'total_rental_fee',
            'security_deposit',
            'platform_fee',
            'total_amount',
            'payment_method',
            'renter_cash_confirmed',
            'renter_cash_confirmed_at',
            'owner_cash_confirmed',
            'owner_cash_confirmed_at',
            'status',
            'approval_deadline',
            'payment_deadline',
            'pickup_spot',
            'created_at',
            'has_reviewed',
        ]

    def get_item_thumbnail(self, obj):
        if hasattr(obj, 'item') and obj.item:
            primary_img = obj.item.images.filter(is_primary=True).first() or obj.item.images.first()
            return primary_img.image_url if primary_img else None
        return None

    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.email

    def get_renter_name(self, obj):
        return f"{obj.renter.first_name} {obj.renter.last_name}".strip() or obj.renter.email

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.owner_id == request.user.id:
                return 'OWNER'
            if obj.renter_id == request.user.id:
                return 'RENTER'
        return 'VIEWER'

    def get_has_reviewed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        from apps.profiles.models import StudentReview
        return StudentReview.objects.filter(booking=obj, reviewer=request.user).exists()


class BookingDetailSerializer(BookingSummarySerializer):
    status_history = BookingStatusHistorySerializer(many=True, read_only=True)
    allowed_actions = serializers.SerializerMethodField()

    class Meta(BookingSummarySerializer.Meta):
        fields = BookingSummarySerializer.Meta.fields + [
            'rejection_reason',
            'cancellation_reason',
            'handover_pass_code',
            'return_notes',
            'approved_at',
            'paid_at',
            'handover_at',
            'returned_at',
            'completed_at',
            'cancelled_at',
            'status_history',
            'allowed_actions'
        ]

    def get_allowed_actions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []

        user = request.user
        role = 'OWNER' if obj.owner_id == user.id else 'RENTER' if obj.renter_id == user.id else 'OTHER'
        actions = []

        if obj.status == Booking.STATUS_PENDING_APPROVAL:
            if role == 'OWNER':
                actions.extend(['ACCEPT', 'REJECT'])
            elif role == 'RENTER':
                actions.append('CANCEL')

        elif obj.status in (Booking.STATUS_APPROVED_PENDING_PAYMENT, 'APPROVED_PENDING_CASH_PAYMENT'):
            if role == 'RENTER':
                if not obj.renter_cash_confirmed:
                    actions.extend(['PAY', 'CONFIRM_CASH_PAID'])
                actions.append('CANCEL')
            elif role == 'OWNER':
                if not obj.owner_cash_confirmed:
                    actions.append('CONFIRM_CASH_RECEIVED')

        elif obj.status == Booking.STATUS_PAID_CONFIRMED:
            actions.append('VIEW_HANDOVER_PASS')
            if role in ('OWNER', 'RENTER'):
                actions.append('CONFIRM_HANDOVER')
                actions.append('CANCEL')

        elif obj.status == Booking.STATUS_ACTIVE:
            if role == 'RENTER':
                actions.append('INITIATE_RETURN')
            actions.append('DISPUTE')

        elif obj.status == Booking.STATUS_RETURNED_PENDING_INSPECTION:
            if role == 'OWNER':
                actions.extend(['COMPLETE_INSPECTION', 'DISPUTE'])
            elif role == 'RENTER':
                actions.append('DISPUTE')

        return actions


class HandoverConfirmSerializer(serializers.Serializer):
    pass_code = serializers.CharField(required=True, max_length=12)


class ActionReasonSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class CompleteInspectionSerializer(serializers.Serializer):
    passed = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class VerifyPickupSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=['OTP', 'QR'], default='OTP')
    otp = serializers.CharField(required=False, allow_blank=True, max_length=12)
    token = serializers.CharField(required=False, allow_blank=True, max_length=256)
    pickup_condition = serializers.ChoiceField(
        choices=['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'],
        default='GOOD'
    )
    pickup_notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        method = attrs.get('method', 'OTP')
        if method == 'OTP' and not attrs.get('otp'):
            raise serializers.ValidationError({'otp': 'OTP passcode is required for OTP verification.'})
        if method == 'QR' and not attrs.get('token') and not attrs.get('otp'):
            raise serializers.ValidationError({'token': 'QR token payload is required for QR verification.'})
        return attrs


class VerifyReturnSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=['OTP', 'QR'], default='OTP')
    otp = serializers.CharField(required=False, allow_blank=True, max_length=12)
    token = serializers.CharField(required=False, allow_blank=True, max_length=256)
    return_item_condition = serializers.ChoiceField(
        choices=['SAME', 'MINOR_WEAR', 'DAMAGED', 'MISSING_ACCESSORIES'],
        default='SAME'
    )
    return_notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        method = attrs.get('method', 'OTP')
        if method == 'OTP' and not attrs.get('otp'):
            raise serializers.ValidationError({'otp': 'OTP passcode is required for OTP verification.'})
        if method == 'QR' and not attrs.get('token') and not attrs.get('otp'):
            raise serializers.ValidationError({'token': 'QR token payload is required for QR verification.'})
        return attrs


class HandoverEvidenceSerializer(serializers.Serializer):
    stage = serializers.ChoiceField(choices=['PICKUP', 'RETURN'])
    image_url = serializers.CharField(max_length=500)
    caption = serializers.CharField(required=False, allow_blank=True, default="")



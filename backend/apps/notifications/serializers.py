from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    booking_id = serializers.UUIDField(source='booking.id', read_only=True, allow_null=True)
    booking_code = serializers.CharField(source='booking.booking_code', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'event_type',
            'title',
            'message',
            'actor_name',
            'booking_id',
            'booking_code',
            'metadata',
            'is_read',
            'created_at',
            'read_at',
        ]
        read_only_fields = fields

    def get_actor_name(self, obj) -> str:
        if not obj.actor:
            return "Campus System"
        full = f"{obj.actor.first_name} {obj.actor.last_name}".strip()
        return full or obj.actor.email


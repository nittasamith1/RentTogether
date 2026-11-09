from django.contrib import admin
from apps.bookings.models import (
    Booking,
    BookingStatusHistory,
    HandoverVerification,
    HandoverVerificationEvent,
    HandoverEvidence,
)


class BookingStatusHistoryInline(admin.TabularInline):
    model = BookingStatusHistory
    extra = 0
    readonly_fields = ['previous_status', 'new_status', 'changed_by', 'reason', 'metadata', 'created_at']
    can_delete = False


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_code',
        'item_title',
        'owner',
        'renter',
        'status',
        'total_amount',
        'start_date',
        'end_date',
        'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['booking_code', 'item_title', 'owner__email', 'renter__email']
    readonly_fields = [
        'booking_code',
        'booking_reference',
        'handover_pass_code',
        'handover_token',
        'requested_at',
        'created_at',
        'updated_at'
    ]
    inlines = [BookingStatusHistoryInline]


@admin.register(BookingStatusHistory)
class BookingStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['booking', 'previous_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['new_status', 'created_at']
    search_fields = ['booking__booking_code', 'changed_by__email', 'reason']
    readonly_fields = ['booking', 'previous_status', 'new_status', 'changed_by', 'reason', 'metadata', 'created_at']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HandoverVerification)
class HandoverVerificationAdmin(admin.ModelAdmin):
    list_display = [
        'booking',
        'pickup_verified',
        'pickup_confirmed_at',
        'pickup_condition',
        'return_verified',
        'return_confirmed_at',
        'return_item_condition'
    ]
    readonly_fields = [
        'pickup_otp_hash',
        'pickup_qr_token_hash',
        'return_otp_hash',
        'return_qr_token_hash',
        'pickup_token_used_at',
        'return_token_used_at',
        'created_at',
        'updated_at'
    ]


@admin.register(HandoverVerificationEvent)
class HandoverVerificationEventAdmin(admin.ModelAdmin):
    list_display = ['booking', 'event_type', 'verification_method', 'performed_by', 'success', 'created_at']
    list_filter = ['event_type', 'verification_method', 'success', 'created_at']
    readonly_fields = ['booking', 'event_type', 'performed_by', 'verification_method', 'success', 'failure_reason', 'metadata', 'created_at']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HandoverEvidence)
class HandoverEvidenceAdmin(admin.ModelAdmin):
    list_display = ['booking', 'evidence_stage', 'uploaded_by', 'caption', 'created_at']
    list_filter = ['evidence_stage', 'created_at']


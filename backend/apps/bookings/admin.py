from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_reference', 'item_title', 'owner', 'renter', 'status', 'rental_price_inr', 'start_date', 'end_date']
    list_filter = ['status', 'created_at']
    search_fields = ['booking_reference', 'item_title', 'owner__email', 'renter__email']
    readonly_fields = ['booking_reference', 'created_at', 'updated_at']


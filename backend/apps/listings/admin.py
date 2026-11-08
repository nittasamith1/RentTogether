from django.contrib import admin
from .models import Item, ItemImage


class ItemImageInline(admin.TabularInline):
    model = ItemImage
    extra = 1


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'owner', 'daily_rental_price', 'condition', 'status', 'is_published', 'created_at')
    list_filter = ('status', 'is_published', 'condition', 'category')
    search_fields = ('title', 'description', 'brand', 'model_name', 'owner__email')
    list_select_related = ('owner', 'category')
    inlines = [ItemImageInline]


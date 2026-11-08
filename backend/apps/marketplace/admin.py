from django.contrib import admin
from .models import Category, Wishlist


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon_name', 'is_active', 'display_order', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('display_order', 'name')


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'created_at')
    search_fields = ('user__email', 'item__title')
    list_select_related = ('user', 'item')


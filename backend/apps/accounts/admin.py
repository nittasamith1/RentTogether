from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, College

@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'domain_whitelist', 'is_active', 'created_at')
    search_fields = ('name', 'code', 'domain_whitelist')
    list_filter = ('is_active',)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'college', 'is_college_verified', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_college_verified', 'is_staff', 'is_active', 'college')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'username')}),
        ('Campus Affiliation', {'fields': ('college', 'is_college_verified')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )


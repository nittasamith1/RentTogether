from django.contrib import admin
from .models import StudentProfile

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'college',
        'department',
        'roll_number',
        'reputation_as_owner',
        'reputation_as_renter',
        'is_verified',
        'created_at'
    )
    list_filter = ('is_verified', 'college', 'department', 'year_of_study')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'roll_number', 'department')


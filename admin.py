"""ElectroHub — Accounts Admin"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, VendorProfile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display  = ('email', 'username', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter   = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering      = ('-date_joined',)

    fieldsets = UserAdmin.fieldsets + (
        ('ElectroHub', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('ElectroHub', {'fields': ('email', 'role', 'phone')}),
    )


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display   = ('business_name', 'user', 'status', 'city', 'state', 'created_at')
    list_filter    = ('status', 'state')
    search_fields  = ('business_name', 'user__email', 'gstin')
    readonly_fields= ('created_at', 'updated_at')
    ordering       = ('-created_at',)
    actions        = ['approve_vendors', 'reject_vendors']

    def approve_vendors(self, request, queryset):
        updated = queryset.filter(status=VendorProfile.Status.PENDING).update(
            status=VendorProfile.Status.APPROVED
        )
        self.message_user(request, f'{updated} vendor(s) approved.')
    approve_vendors.short_description = '✅ Approve selected vendors'

    def reject_vendors(self, request, queryset):
        updated = queryset.filter(status=VendorProfile.Status.PENDING).update(
            status=VendorProfile.Status.REJECTED,
            rejection_reason='Rejected by admin.'
        )
        self.message_user(request, f'{updated} vendor(s) rejected.')
    reject_vendors.short_description = '❌ Reject selected vendors'

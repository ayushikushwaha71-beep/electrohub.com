"""
ElectroHub — Accounts Models
CustomUser with role support + VendorProfile
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    """Extended user with role field."""

    class Role(models.TextChoices):
        CUSTOMER = 'customer', _('Customer')
        VENDOR   = 'vendor',   _('Vendor')
        ADMIN    = 'admin',    _('Admin')

    email = models.EmailField(_('email address'), unique=True)
    role  = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'

    @property
    def is_vendor(self):
        return self.role == self.Role.VENDOR

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_staff


class VendorProfile(models.Model):
    """Vendor business profile — linked 1:1 to a CustomUser with role=vendor."""

    class Status(models.TextChoices):
        PENDING  = 'pending',  _('Pending Approval')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
        SUSPENDED= 'suspended',_('Suspended')

    user             = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='vendor_profile')
    business_name    = models.CharField(max_length=200)
    business_address = models.TextField(blank=True)
    city             = models.CharField(max_length=100, blank=True)
    state            = models.CharField(max_length=100, blank=True)
    pincode          = models.CharField(max_length=10, blank=True)
    gstin            = models.CharField(max_length=15, blank=True, verbose_name='GSTIN')
    description      = models.TextField(blank=True)
    logo             = models.ImageField(upload_to='vendor_logos/', null=True, blank=True)
    website          = models.URLField(blank=True)
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Vendor Profile'
        verbose_name_plural = 'Vendor Profiles'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.business_name} ({self.get_status_display()})'

    @property
    def is_approved(self):
        return self.status == self.Status.APPROVED

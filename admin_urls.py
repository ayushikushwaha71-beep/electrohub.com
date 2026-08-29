"""ElectroHub — Admin API URLs for Vendor Management"""

from django.urls import path
from .admin_views import AdminVendorListView, approve_vendor, reject_vendor, suspend_vendor

urlpatterns = [
    path('vendors/',                    AdminVendorListView.as_view(), name='admin-vendor-list'),
    path('vendors/<int:vendor_id>/approve/', approve_vendor,           name='admin-vendor-approve'),
    path('vendors/<int:vendor_id>/reject/',  reject_vendor,            name='admin-vendor-reject'),
    path('vendors/<int:vendor_id>/suspend/', suspend_vendor,           name='admin-vendor-suspend'),
]

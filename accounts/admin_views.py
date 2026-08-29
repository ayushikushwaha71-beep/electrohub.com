from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import VendorProfile
from .serializers import VendorProfileSerializer
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view): return bool(request.user.is_authenticated and request.user.is_admin_user)
class AdminVendorListView(generics.ListAPIView):
    serializer_class = VendorProfileSerializer; permission_classes = [IsAdminUser]
    def get_queryset(self): return VendorProfile.objects.select_related('user').all()
def change_status(request, vendor_id, new_status):
    try: vendor = VendorProfile.objects.get(pk=vendor_id)
    except VendorProfile.DoesNotExist: return Response({'detail':'Vendor not found.'}, status=404)
    vendor.status = new_status; vendor.rejection_reason = request.data.get('reason','') if new_status == VendorProfile.Status.REJECTED else ''; vendor.save(); return Response(VendorProfileSerializer(vendor).data)
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def approve_vendor(request, vendor_id): return change_status(request, vendor_id, VendorProfile.Status.APPROVED)
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def reject_vendor(request, vendor_id): return change_status(request, vendor_id, VendorProfile.Status.REJECTED)
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def suspend_vendor(request, vendor_id): return change_status(request, vendor_id, VendorProfile.Status.SUSPENDED)

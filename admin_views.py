"""ElectroHub — Admin API Views for Vendor Management"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.models import VendorProfile
from accounts.serializers import VendorProfileSerializer


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.role == 'admin')


class AdminVendorListView(generics.ListAPIView):
    """Admin: list all vendors with filtering by status."""
    serializer_class   = VendorProfileSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = VendorProfile.objects.select_related('user').all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def approve_vendor(request, vendor_id):
    try:
        vendor = VendorProfile.objects.get(id=vendor_id)
    except VendorProfile.DoesNotExist:
        return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

    vendor.status = VendorProfile.Status.APPROVED
    vendor.rejection_reason = ''
    vendor.save(update_fields=['status', 'rejection_reason'])

    return Response({
        'message': f'{vendor.business_name} approved successfully.',
        'vendor': VendorProfileSerializer(vendor, context={'request': request}).data,
    })


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def reject_vendor(request, vendor_id):
    try:
        vendor = VendorProfile.objects.get(id=vendor_id)
    except VendorProfile.DoesNotExist:
        return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('reason', 'Does not meet our vendor requirements.')
    vendor.status = VendorProfile.Status.REJECTED
    vendor.rejection_reason = reason
    vendor.save(update_fields=['status', 'rejection_reason'])

    return Response({
        'message': f'{vendor.business_name} rejected.',
        'vendor': VendorProfileSerializer(vendor, context={'request': request}).data,
    })


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def suspend_vendor(request, vendor_id):
    try:
        vendor = VendorProfile.objects.get(id=vendor_id)
    except VendorProfile.DoesNotExist:
        return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

    vendor.status = VendorProfile.Status.SUSPENDED
    vendor.save(update_fields=['status'])
    return Response({'message': f'{vendor.business_name} suspended.'})

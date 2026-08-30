from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductSerializer


def approved_vendor(user):
    return (
        user.is_authenticated
        and getattr(user, 'role', '').lower() == 'vendor'
        and getattr(getattr(user, 'vendor_profile', None), 'status', None) == 'approved'
    )


class ProductListView(generics.ListCreateAPIView):
    serializer_class  = ProductSerializer
    filter_backends   = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields     = ['name', 'sku', 'short_description']
    ordering_fields   = ['price', 'discount_price', 'created_at', 'stock']
    ordering          = ['-created_at']
    filterset_fields  = ['category_id', 'brand_id', 'status']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related('vendor')

        # Optional vendor filter: ?vendor=<vendor_profile_id>
        vendor_id = self.request.query_params.get('vendor')
        if vendor_id:
            qs = qs.filter(vendor_id=vendor_id)

        # Optional in_stock filter: ?in_stock=true
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            qs = qs.filter(stock__gt=0)

        # Optional is_featured filter: ?featured=true
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            qs = qs.filter(is_featured=True)

        return qs

    def perform_create(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can create products.')
        serializer.save(vendor=self.request.user.vendor_profile)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    lookup_field     = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return Product.objects.filter(is_active=True).select_related('vendor')
        return Product.objects.filter(vendor__user=self.request.user)

    def perform_update(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can edit products.')
        serializer.save()

    def perform_destroy(self, instance):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can delete products.')
        instance.is_active = False
        instance.status    = 'inactive'
        instance.save(update_fields=['is_active', 'status'])


class VendorProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Product.objects.filter(vendor__user=self.request.user).select_related('vendor')

    def perform_create(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can create products.')
        serializer.save(vendor=self.request.user.vendor_profile)

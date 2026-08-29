from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer
class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view): return bool(request.user.is_authenticated and request.user.role.lower() == 'customer')
class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCustomer]
    def get_queryset(self): return Order.objects.filter(customer=self.request.user).prefetch_related('items__product','items__vendor')
    def get_serializer_class(self): return CreateOrderSerializer if self.request.method == 'POST' else OrderSerializer
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer; permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        if self.request.user.role.lower() == 'vendor': return Order.objects.filter(items__vendor__user=self.request.user).distinct().prefetch_related('items__product','items__vendor')
        if self.request.user.role.lower() == 'admin': return Order.objects.all().prefetch_related('items__product','items__vendor')
        return Order.objects.filter(customer=self.request.user).prefetch_related('items__product','items__vendor')
class VendorOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer; permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        if self.request.user.role.lower() != 'vendor' or getattr(self.request.user.vendor_profile, 'status', '') != 'approved': raise PermissionDenied('Approved vendors only.')
        return Order.objects.filter(items__vendor__user=self.request.user).distinct().prefetch_related('items__product','items__vendor')

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def vendor_order_status(request, pk):
    if request.user.role.lower() != 'vendor' or getattr(request.user.vendor_profile, 'status', '') != 'approved':
        raise PermissionDenied('Approved vendors only.')
    order = Order.objects.filter(pk=pk, items__vendor__user=request.user).distinct().first()
    if not order:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
    new_status = request.data.get('status')
    valid_statuses = {value for value, _ in Order.STATUS_CHOICES}
    if new_status not in valid_statuses:
        return Response({'status': 'Choose a valid order status.'}, status=status.HTTP_400_BAD_REQUEST)
    order.status = new_status
    order.save(update_fields=['status', 'updated_at'])
    return Response(OrderSerializer(order).data)

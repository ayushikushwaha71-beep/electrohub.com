from django.urls import path
from .views import OrderListCreateView, OrderDetailView, VendorOrderListView, vendor_order_status
urlpatterns = [path('', OrderListCreateView.as_view()), path('vendor/', VendorOrderListView.as_view()), path('vendor/<int:pk>/status/', vendor_order_status), path('<int:pk>/', OrderDetailView.as_view())]

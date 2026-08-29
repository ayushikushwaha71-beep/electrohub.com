from django.urls import path
from .views import ProductListView, ProductDetailView, VendorProductListView
urlpatterns = [path('vendor/', VendorProductListView.as_view()), path('', ProductListView.as_view()), path('<slug:slug>/', ProductDetailView.as_view())]

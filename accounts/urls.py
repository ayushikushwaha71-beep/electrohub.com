from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, CustomerRegisterView, VendorRegisterView, VendorProfileView, UserProfileView, logout_view
urlpatterns = [path('login/', LoginView.as_view()), path('token/refresh/', TokenRefreshView.as_view()), path('register/', CustomerRegisterView.as_view()), path('vendor/register/', VendorRegisterView.as_view()), path('vendor/profile/', VendorProfileView.as_view()), path('profile/', UserProfileView.as_view()), path('logout/', logout_view)]

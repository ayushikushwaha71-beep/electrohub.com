"""ElectroHub — Accounts URLs"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    CustomerRegisterView,
    VendorRegisterView,
    VendorProfileView,
    UserProfileView,
    logout_view,
)

urlpatterns = [
    path('login/',           LoginView.as_view(),          name='auth-login'),
    path('token/refresh/',   TokenRefreshView.as_view(),   name='token-refresh'),
    path('register/',        CustomerRegisterView.as_view(), name='customer-register'),
    path('logout/',          logout_view,                  name='auth-logout'),
    path('profile/',         UserProfileView.as_view(),    name='user-profile'),

    # Vendor auth
    path('vendor/register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('vendor/profile/',  VendorProfileView.as_view(),  name='vendor-profile'),
]

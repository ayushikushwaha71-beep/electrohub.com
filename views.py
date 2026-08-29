"""ElectroHub — Accounts Views"""

from django.contrib.auth import get_user_model
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import VendorProfile
from .serializers import (
    CustomerRegisterSerializer,
    VendorRegisterSerializer,
    VendorProfileSerializer,
    UserProfileSerializer,
    ElectroHubTokenSerializer,
)

User = get_user_model()


# ─── JWT Login ────────────────────────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    """Login for all users — returns JWT with role info."""
    serializer_class = ElectroHubTokenSerializer


# ─── Customer Registration ────────────────────────────────────────────────────
class CustomerRegisterView(generics.CreateAPIView):
    serializer_class   = CustomerRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Auto-generate JWT tokens on registration
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Account created successfully.',
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id':    user.id,
                'email': user.email,
                'name':  user.get_full_name(),
                'role':  user.role,
            },
        }, status=status.HTTP_201_CREATED)


# ─── Vendor Registration ──────────────────────────────────────────────────────
class VendorRegisterView(generics.CreateAPIView):
    serializer_class   = VendorRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': (
                'Vendor account created successfully. '
                'Your application is pending admin approval. '
                'You will be notified once approved.'
            ),
            'user': {
                'id':    user.id,
                'email': user.email,
                'name':  user.get_full_name(),
                'role':  user.role,
            },
        }, status=status.HTTP_201_CREATED)


# ─── Vendor Profile ───────────────────────────────────────────────────────────
class VendorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return self.request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Vendor profile not found.')


# ─── User Profile ─────────────────────────────────────────────────────────────
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Logout (blacklist refresh token) ────────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully.'})
    except Exception:
        return Response({'message': 'Logged out.'})

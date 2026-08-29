from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import VendorProfile
from .serializers import CustomerRegisterSerializer, VendorRegisterSerializer, VendorProfileSerializer, UserProfileSerializer, ElectroHubTokenSerializer
User = get_user_model()

class LoginView(TokenObtainPairView): serializer_class = ElectroHubTokenSerializer
class CustomerRegisterView(generics.CreateAPIView):
    serializer_class = CustomerRegisterSerializer; permission_classes = [permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        user = self.get_serializer(data=request.data); user.is_valid(raise_exception=True); account = user.save(); refresh = RefreshToken.for_user(account); return Response({'access': str(refresh.access_token), 'refresh': str(refresh), 'user': {'id': account.id, 'email': account.email, 'name': account.get_full_name(), 'role': account.role.lower()}}, status=status.HTTP_201_CREATED)
class VendorRegisterView(generics.CreateAPIView):
    serializer_class = VendorRegisterSerializer; permission_classes = [permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data); serializer.is_valid(raise_exception=True); user = serializer.save(); return Response({'message': 'Vendor application submitted successfully. Your account is pending admin approval.', 'user': {'id': user.id, 'email': user.email, 'name': user.get_full_name(), 'role': user.role.lower()}}, status=status.HTTP_201_CREATED)
class VendorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = VendorProfileSerializer; permission_classes = [permissions.IsAuthenticated]
    def get_object(self): return self.request.user.vendor_profile
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer; permission_classes = [permissions.IsAuthenticated]
    def get_object(self): return self.request.user
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    token = request.data.get('refresh')
    if token:
        try: RefreshToken(token).blacklist()
        except Exception: pass
    return Response({'message': 'Logged out successfully.'})

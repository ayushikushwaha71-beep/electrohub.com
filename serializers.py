"""ElectroHub — Accounts Serializers"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import VendorProfile

User = get_user_model()


# ─── Custom JWT token with extra claims ──────────────────────────────────────
class ElectroHubTokenSerializer(TokenObtainPairSerializer):
    """Add user role and name to JWT token payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['name']  = user.get_full_name() or user.username
        token['role']  = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id':    self.user.id,
            'email': self.user.email,
            'name':  self.user.get_full_name() or self.user.username,
            'role':  self.user.role,
        }
        return data


# ─── Customer Registration ────────────────────────────────────────────────────
class CustomerRegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'confirm_password', 'phone')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name':  {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email      = validated_data['email'],
            username   = validated_data.get('username', validated_data['email']),
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            password   = validated_data['password'],
            phone      = validated_data.get('phone', ''),
            role       = User.Role.CUSTOMER,
        )
        return user


# ─── Vendor Profile Serializer ────────────────────────────────────────────────
class VendorProfileSerializer(serializers.ModelSerializer):
    email         = serializers.EmailField(source='user.email', read_only=True)
    name          = serializers.SerializerMethodField()
    status_display= serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = VendorProfile
        fields = (
            'id', 'email', 'name', 'business_name', 'business_address',
            'city', 'state', 'pincode', 'gstin', 'description',
            'logo', 'website', 'status', 'status_display',
            'rejection_reason', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'rejection_reason', 'created_at', 'updated_at')

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


# ─── Vendor Registration ──────────────────────────────────────────────────────
class VendorRegisterSerializer(serializers.Serializer):
    # User fields
    email            = serializers.EmailField()
    first_name       = serializers.CharField(max_length=150)
    last_name        = serializers.CharField(max_length=150)
    phone            = serializers.CharField(max_length=20, required=False, default='')
    password         = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    # Vendor profile fields
    business_name    = serializers.CharField(max_length=200)
    business_address = serializers.CharField(required=False, default='')
    city             = serializers.CharField(max_length=100, required=False, default='')
    state            = serializers.CharField(max_length=100, required=False, default='')
    pincode          = serializers.CharField(max_length=10, required=False, default='')
    gstin            = serializers.CharField(max_length=15, required=False, default='')
    description      = serializers.CharField(required=False, default='')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        # Create User
        user = User.objects.create_user(
            email      = validated_data['email'],
            username   = validated_data['email'],
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            password   = validated_data['password'],
            phone      = validated_data.get('phone', ''),
            role       = User.Role.VENDOR,
        )
        # Create VendorProfile (pending approval)
        VendorProfile.objects.create(
            user             = user,
            business_name    = validated_data['business_name'],
            business_address = validated_data.get('business_address', ''),
            city             = validated_data.get('city', ''),
            state            = validated_data.get('state', ''),
            pincode          = validated_data.get('pincode', ''),
            gstin            = validated_data.get('gstin', ''),
            description      = validated_data.get('description', ''),
            status           = VendorProfile.Status.PENDING,
        )
        return user


# ─── User Profile (readonly) ──────────────────────────────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'date_joined')
        read_only_fields = ('id', 'email', 'role', 'date_joined')

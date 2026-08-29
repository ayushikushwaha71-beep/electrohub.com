from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import VendorProfile

User = get_user_model()

class ElectroHubTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.lower()
        token['name'] = user.get_full_name() or user.email
        return token
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {'id': self.user.id, 'email': self.user.email, 'name': self.user.get_full_name() or self.user.email, 'role': self.user.role.lower()}
        return data

class CustomerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'confirm_password', 'phone')
    def validate(self, attrs):
        if attrs.pop('password') != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        attrs['password_value'] = self.initial_data['password']
        return attrs
    def create(self, validated_data):
        password = validated_data.pop('password_value')
        return User.objects.create_user(role=User.Role.CUSTOMER, password=password, **validated_data)

class VendorRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(); first_name = serializers.CharField(); last_name = serializers.CharField(); phone = serializers.CharField(required=False, allow_blank=True); password = serializers.CharField(write_only=True, validators=[validate_password]); confirm_password = serializers.CharField(write_only=True); business_name = serializers.CharField(); business_address = serializers.CharField(required=False, allow_blank=True); city = serializers.CharField(required=False, allow_blank=True); state = serializers.CharField(required=False, allow_blank=True); pincode = serializers.CharField(required=False, allow_blank=True); gstin = serializers.CharField(required=False, allow_blank=True); description = serializers.CharField(required=False, allow_blank=True)
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'): raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs
    def create(self, data):
        password = data.pop('password'); profile_data = {key: data.pop(key, '') for key in ('business_name','business_address','city','state','pincode','gstin','description')}; user = User.objects.create_user(password=password, role=User.Role.VENDOR, **data); VendorProfile.objects.create(user=user, **profile_data); return user

class VendorProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    name = serializers.SerializerMethodField()
    class Meta:
        model = VendorProfile
        fields = ('id','email','name','business_name','business_address','city','state','pincode','gstin','description','website','status','rejection_reason','created_at','updated_at')
        read_only_fields = ('id','status','rejection_reason','created_at','updated_at')
    def get_name(self, obj): return obj.user.get_full_name() or obj.user.email

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id','email','first_name','last_name','phone','role','date_joined')
        read_only_fields = ('id','email','role','date_joined')

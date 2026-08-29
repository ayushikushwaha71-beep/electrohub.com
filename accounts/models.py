from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', self.model.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):

    username = None
    groups = None
    user_permissions = None

    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        VENDOR = 'VENDOR', 'Vendor'
        ADMIN = 'ADMIN', 'Admin'

    # Existing database column is "email"
    email = models.EmailField(unique=True)

    # Existing database already has "role"
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER
    )

    # Existing database column is "phone_number"
    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        db_column='phone_number'
    )
    profile_image = models.CharField(max_length=255, blank=True, default='')
    bio = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    updated_at = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    # Existing database uses email for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'accounts_user'

    @property
    def is_admin_user(self):
        return self.is_staff or self.role == self.Role.ADMIN


class VendorProfile(models.Model):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Approval'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='vendor_profile'
    )

    business_name = models.CharField(max_length=200)
    business_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    gstin = models.CharField(max_length=15, blank=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
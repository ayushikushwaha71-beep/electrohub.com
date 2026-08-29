from django.db import models
from accounts.models import VendorProfile


class Product(models.Model):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('draft', 'Draft'),
        ('inactive', 'Inactive'),
    ]

    # Existing products ke liye temporarily nullable.
    # Baad mein sab products ko vendor assign karke required kar sakte hain.
    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.PROTECT,
        related_name='products',
        null=True,
        blank=True,
    )

    external_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=200)

    slug = models.SlugField(
        max_length=220,
        unique=True,
    )

    category_id = models.IntegerField(db_column='category_id', null=True, blank=True)
    brand_id = models.IntegerField(db_column='brand_id', null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    minimum_stock = models.PositiveIntegerField(default=0)
    weight = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)

    sku = models.CharField(
        max_length=100,
        unique=True,
    )

    short_description = models.TextField(blank=True)

    description = models.TextField(blank=True)

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    discount_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    stock = models.PositiveIntegerField(default=0)

    is_featured = models.BooleanField(default=False)

    is_trending = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
    )

    class Meta:
        db_table = 'products'

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    @property
    def final_price(self):
        return self.discount_price or self.price

    @property
    def in_stock(self):
        return self.stock > 0
from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.IntegerField(source='category_id', read_only=True)
    category_name = serializers.SerializerMethodField()
    brand = serializers.IntegerField(source='brand_id', read_only=True)
    brand_name = serializers.SerializerMethodField()
    final_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    vendor_id = serializers.IntegerField(source='vendor.id', read_only=True)
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'category', 'category_name', 'brand', 'brand_name',
            'sku', 'short_description', 'description', 'price', 'discount_price',
            'final_price', 'stock', 'in_stock', 'is_featured', 'is_trending',
            'is_active', 'status', 'images', 'vendor_id', 'vendor_name',
            'created_at', 'updated_at',
        )
        read_only_fields = ('vendor_id', 'vendor_name', 'created_at', 'updated_at')

    # Maps actual DB slugs → image filename in Next.js public/images/products/
    SLUG_IMAGE_MAP = {
        # Current DB products (slug from DB)
        'arduino-uno-r3':                           'arduino-uno-r4-wifi.jpg',
        'arduino-nano':                             'arduino-nano-every.png',
        'raspberry-pi-5-8gb':                       'raspberry-pi-5.svg',
        'esp32-wifi-bluetooth-development-board':   'esp32-s3-devkit-c.svg',
        'hc-sr04-ultrasonic-sensor':               'dht22-temperature-humidity-sensor.svg',
        'dc-gear-motor-12v':                        'nema-17-stepper-motor.svg',
        '096-inch-oled-display':                    'oled-096-display.svg',
        # Legacy external_id keys kept for backward compatibility
        'ard-001': 'arduino-uno-r4-wifi.jpg',
        'ard-002': 'arduino-mega-2560-r3.jpg',
        'ard-003': 'arduino-nano-every.png',
        'rpi-001': 'raspberry-pi-5.svg',
        'rpi-002': 'raspberry-pi-4-model-b.svg',
        'esp-001': 'esp8266-nodemcu-v3.jpg',
        'sen-001': 'dht22-temperature-humidity-sensor.svg',
    }
    DEFAULT_IMAGE = 'arduino-nano-every.svg'

    def get_images(self, obj):
        # Try slug → external_id → fallback
        filename = (
            self.SLUG_IMAGE_MAP.get(obj.slug)
            or self.SLUG_IMAGE_MAP.get(obj.external_id or '')
            or self.DEFAULT_IMAGE
        )
        return [{
            'id': obj.id,
            'image': f'/images/products/{filename}',
            'alt_text': obj.name,
            'is_primary': True,
            'sort_order': 0,
        }]

    CATEGORY_MAP = {
        1: 'Arduino',
        2: 'Raspberry Pi',
        3: 'ESP32 / ESP8266',
        4: 'Sensors',
        5: 'Motors & Actuators',
        6: 'Displays',
    }

    BRAND_MAP = {
        1: 'Arduino',
        2: 'Raspberry Pi',
        3: 'Espressif',
        4: 'Generic',
    }

    def get_category_name(self, obj):
        return self.CATEGORY_MAP.get(obj.category_id, 'Electronics')

    def get_brand_name(self, obj):
        return self.BRAND_MAP.get(obj.brand_id, 'Electronics')

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
        fields = ('id','name','slug','category','category_name','brand','brand_name','sku','short_description','description','price','discount_price','final_price','stock','in_stock','is_featured','is_trending','is_active','status','images','vendor_id','vendor_name','created_at','updated_at')
        read_only_fields = ('vendor_id','vendor_name','created_at','updated_at')

    def get_images(self, obj):
        filename = {'ard-001': 'arduino-uno-r4-wifi.svg', 'ard-002': 'arduino-mega-2560-r3.svg', 'ard-003': 'arduino-nano-every.svg', 'rpi-001': 'raspberry-pi-5.svg', 'rpi-002': 'raspberry-pi-4-model-b.svg', 'esp-001': 'esp8266-nodemcu-v3.svg', 'sen-001': 'dht22-temperature-humidity-sensor.svg'}.get(obj.external_id, 'arduino-nano-every.svg')
        return [{'id': obj.id, 'image': f'/images/products/{filename}', 'alt_text': obj.name, 'is_primary': True, 'sort_order': 0}]

    def get_category_name(self, obj):
        return {1: 'Arduino', 2: 'Raspberry Pi', 3: 'ESP32 / ESP8266', 4: 'Sensors'}.get(obj.category_id, 'Electronics')

    def get_brand_name(self, obj):
        return {1: 'Arduino', 2: 'Raspberry Pi'}.get(obj.brand_id, 'Electronics')

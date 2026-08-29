from django.db import transaction
from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    class Meta:
        model = OrderItem
        fields = ('id','product','product_name','vendor','vendor_name','quantity','unit_price','total_price')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ('id','order_number','customer','status','total_amount','full_name','phone','email','address','city','state','pincode','payment_method','items','created_at','updated_at')
        read_only_fields = ('id','order_number','customer','status','total_amount','items','created_at','updated_at')

class CreateOrderSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)
    class Meta:
        model = Order
        fields = ('full_name','phone','email','address','city','state','pincode','payment_method','items')
    @transaction.atomic
    def create(self, validated_data):
        raw_items = validated_data.pop('items')
        if not raw_items: raise serializers.ValidationError({'items': 'At least one item is required.'})
        order = Order.objects.create(customer=self.context['request'].user, order_number=f"EH-{Order.objects.count() + 10001}", **validated_data)
        total = 0
        for raw in raw_items:
            try:
                product = Product.objects.select_related('vendor').filter(is_active=True).filter(pk=raw['product_id']).first() or Product.objects.select_related('vendor').get(external_id=raw['product_id'], is_active=True)
            except (Product.DoesNotExist, KeyError, ValueError): raise serializers.ValidationError({'items': 'One or more products are invalid.'})
            quantity = int(raw.get('quantity', 1))
            if quantity < 1 or quantity > product.stock: raise serializers.ValidationError({'items': f'Invalid quantity for {product.name}.'})
            unit_price = product.final_price; line_total = unit_price * quantity
            OrderItem.objects.create(order=order, product=product, vendor=product.vendor, quantity=quantity, unit_price=unit_price, total_price=line_total)
            total += line_total
        order.total_amount = total; order.save(update_fields=['total_amount']); return order

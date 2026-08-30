from django.db import transaction
from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    vendor_name  = serializers.CharField(source='vendor.business_name', read_only=True)

    class Meta:
        model  = OrderItem
        fields = ('id', 'product', 'product_name', 'vendor', 'vendor_name',
                  'quantity', 'unit_price', 'total_price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model  = Order
        fields = (
            'id', 'order_number', 'customer', 'status', 'total_amount',
            'full_name', 'phone', 'email', 'address', 'city', 'state',
            'pincode', 'payment_method', 'items', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'order_number', 'customer', 'status', 'total_amount',
            'items', 'created_at', 'updated_at',
        )


# ── Vendor-scoped serializer ──────────────────────────────────────────────────
# Returns only the OrderItems that belong to the requesting vendor so that
# one vendor cannot see another vendor's line-items in a shared order.

class VendorOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    vendor_name  = serializers.CharField(source='vendor.business_name', read_only=True)

    class Meta:
        model  = OrderItem
        fields = ('id', 'product', 'product_name', 'vendor', 'vendor_name',
                  'quantity', 'unit_price', 'total_price')


class VendorOrderSerializer(serializers.ModelSerializer):
    """
    Like OrderSerializer but filters `items` to only those belonging
    to the vendor identified by context['vendor_profile'].
    """
    items = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = (
            'id', 'order_number', 'customer', 'status', 'total_amount',
            'full_name', 'phone', 'email', 'address', 'city', 'state',
            'pincode', 'payment_method', 'items', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'order_number', 'customer', 'status', 'total_amount',
            'items', 'created_at', 'updated_at',
        )

    def get_items(self, obj):
        vendor_profile = self.context.get('vendor_profile')
        if vendor_profile is None:
            # Fallback — return all items (should not normally happen)
            qs = obj.items.all()
        else:
            qs = obj.items.filter(vendor=vendor_profile)
        return VendorOrderItemSerializer(qs, many=True).data


class CreateOrderSerializer(serializers.Serializer):
    """
    Write-only serializer for creating orders.
    Uses plain Serializer (not ModelSerializer) so that the write_only
    ListField is preserved correctly in validated_data on all Python versions.
    """
    full_name       = serializers.CharField(max_length=150)
    phone           = serializers.CharField(max_length=30)
    email           = serializers.EmailField()
    address         = serializers.CharField()
    city            = serializers.CharField(max_length=100)
    state           = serializers.CharField(max_length=100)
    pincode         = serializers.CharField(max_length=10)
    payment_method  = serializers.CharField(max_length=30, default='cod')
    items           = serializers.ListField(child=serializers.DictField())

    def create(self, validated_data):
        raw_items = validated_data.pop('items')
        if not raw_items:
            raise serializers.ValidationError({'items': 'At least one item is required.'})

        with transaction.atomic():
            order = Order.objects.create(
                customer=self.context['request'].user,
                order_number=f"EH-{Order.objects.count() + 10001}",
                **validated_data,
            )

            total = 0
            products_to_update = []  # collect for bulk stock update

            for raw in raw_items:
                # ── Resolve product ───────────────────────────────────────────────
                product = None
                raw_id  = raw.get('product_id')

                # Try integer primary key first
                try:
                    pk      = int(raw_id)
                    product = (
                        Product.objects
                        .select_related('vendor')
                        .filter(pk=pk, is_active=True)
                        .first()
                    )
                except (TypeError, ValueError):
                    pass

                # Fall back to external_id (string slugs like "ard-001")
                if product is None and raw_id is not None:
                    try:
                        product = (
                            Product.objects
                            .select_related('vendor')
                            .get(external_id=str(raw_id), is_active=True)
                        )
                    except Product.DoesNotExist:
                        pass

                if product is None:
                    raise serializers.ValidationError(
                        {'items': f'Product "{raw_id}" not found or inactive.'}
                    )

                # ── Validate quantity ─────────────────────────────────────────────
                try:
                    quantity = int(raw.get('quantity', 1))
                except (TypeError, ValueError):
                    raise serializers.ValidationError(
                        {'items': f'Invalid quantity for product "{raw_id}".'}
                    )

                if quantity < 1:
                    raise serializers.ValidationError(
                        {'items': f'Quantity for "{product.name}" must be at least 1.'}
                    )
                if quantity > product.stock:
                    raise serializers.ValidationError(
                        {'items': f'Only {product.stock} units of "{product.name}" are in stock.'}
                    )

                # ── Create order item ─────────────────────────────────────────────
                unit_price = product.final_price
                line_total = unit_price * quantity
                OrderItem.objects.create(
                    order      = order,
                    product    = product,
                    vendor     = product.vendor,
                    quantity   = quantity,
                    unit_price = unit_price,
                    total_price= line_total,
                )
                total += line_total

                # Queue stock reduction (done after all validations pass)
                product.stock -= quantity
                products_to_update.append(product)

            # ── Persist stock changes ─────────────────────────────────────────────
            for product in products_to_update:
                product.save(update_fields=['stock', 'updated_at'])

            # ── Finalise order totals ─────────────────────────────────────────────
            order.total_amount = total
            order.subtotal     = total
            order.save(update_fields=['total_amount', 'subtotal'])

        return order


'use client';

/**
 * Mock Order storage — persists to localStorage so orders survive refresh.
 * Seeded with a few sample orders per user on first load.
 */

import type { OrderStatus } from '@/types';

export interface MockOrderItem {
  id:           string;
  productId:    string;
  productName:  string;
  productImage: string;
  sku:          string;
  quantity:     number;
  sellingPrice: number;
  originalPrice:number;
  discount:     number;
}

export interface MockOrder {
  id:             string;
  orderNumber:    string;
  userId:         string;
  items:          MockOrderItem[];
  subtotal:       number;
  discount:       number;
  deliveryCharge: number;
  total:          number;
  status:         OrderStatus;
  paymentMethod:  string;
  paymentStatus:  string;
  trackingNumber?:string;
  estimatedDelivery?: string;
  createdAt:      string;
  updatedAt:      string;
  shippingAddress: {
    firstName: string;
    lastName:  string;
    phone:     string;
    line1:     string;
    city:      string;
    state:     string;
    pincode:   string;
    country:   string;
  };
}

const ORDERS_KEY = 'electrohub_orders';

const SEED_ORDERS: MockOrder[] = [
  {
    id:             'ord-001',
    orderNumber:    'EH-20250812-0001',
    userId:         '__seed__',
    items: [
      {
        id:           'oi-001',
        productId:    'ard-001',
        productName:  'Arduino Uno R3 Microcontroller Board',
        productImage: 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=120&h=120&fit=crop',
        sku:          'ARD-UNO-R3',
        quantity:     2,
        sellingPrice: 549,
        originalPrice:699,
        discount:     21,
      },
      {
        id:           'oi-002',
        productId:    'sen-001',
        productName:  'DHT22 Temperature & Humidity Sensor',
        productImage: 'https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=120&h=120&fit=crop',
        sku:          'SEN-DHT22',
        quantity:     3,
        sellingPrice: 149,
        originalPrice:199,
        discount:     25,
      },
    ],
    subtotal:       1545,
    discount:       153,
    deliveryCharge: 0,
    total:          1545,
    status:         'delivered',
    paymentMethod:  'upi',
    paymentStatus:  'paid',
    trackingNumber: 'TRK123456789IN',
    estimatedDelivery: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt:      new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt:      new Date(Date.now() - 3  * 86400000).toISOString(),
    shippingAddress: {
      firstName: 'Alex',
      lastName:  'Johnson',
      phone:     '9876543210',
      line1:     '42 Circuit Street, Koramangala',
      city:      'Bengaluru',
      state:     'Karnataka',
      pincode:   '560034',
      country:   'India',
    },
  },
  {
    id:             'ord-002',
    orderNumber:    'EH-20250814-0002',
    userId:         '__seed__',
    items: [
      {
        id:           'oi-003',
        productId:    'esp-001',
        productName:  'ESP32 Development Board (38-pin)',
        productImage: 'https://images.unsplash.com/photo-1557318041-1ce374d55ebf?w=120&h=120&fit=crop',
        sku:          'ESP32-DEV-38',
        quantity:     1,
        sellingPrice: 399,
        originalPrice:549,
        discount:     27,
      },
    ],
    subtotal:       399,
    discount:       150,
    deliveryCharge: 49,
    total:          448,
    status:         'shipped',
    paymentMethod:  'card',
    paymentStatus:  'paid',
    trackingNumber: 'TRK987654321IN',
    estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt:      new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt:      new Date(Date.now() - 1 * 86400000).toISOString(),
    shippingAddress: {
      firstName: 'Alex',
      lastName:  'Johnson',
      phone:     '9876543210',
      line1:     '42 Circuit Street, Koramangala',
      city:      'Bengaluru',
      state:     'Karnataka',
      pincode:   '560034',
      country:   'India',
    },
  },
  {
    id:             'ord-003',
    orderNumber:    'EH-20250815-0003',
    userId:         '__seed__',
    items: [
      {
        id:           'oi-004',
        productId:    'rpi-001',
        productName:  'Raspberry Pi 4 Model B (4GB RAM)',
        productImage: 'https://images.unsplash.com/photo-1587588354456-ae376af71a25?w=120&h=120&fit=crop',
        sku:          'RPI-4B-4G',
        quantity:     1,
        sellingPrice: 4299,
        originalPrice:4999,
        discount:     14,
      },
    ],
    subtotal:       4299,
    discount:       700,
    deliveryCharge: 0,
    total:          4299,
    status:         'processing',
    paymentMethod:  'netbanking',
    paymentStatus:  'paid',
    createdAt:      new Date(Date.now() - 4 * 3600000).toISOString(),
    updatedAt:      new Date(Date.now() - 2 * 3600000).toISOString(),
    shippingAddress: {
      firstName: 'Alex',
      lastName:  'Johnson',
      phone:     '9876543210',
      line1:     '42 Circuit Street, Koramangala',
      city:      'Bengaluru',
      state:     'Karnataka',
      pincode:   '560034',
      country:   'India',
    },
  },
];

function getKey(userId: string) {
  return `${ORDERS_KEY}_${userId}`;
}

export function getStoredOrders(userId: string): MockOrder[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (raw) return JSON.parse(raw) as MockOrder[];

    // Seed on first access
    const seeded = SEED_ORDERS.map((o) => ({ ...o, userId }));
    localStorage.setItem(getKey(userId), JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveOrders(userId: string, orders: MockOrder[]) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(orders));
  } catch {
    // ignore
  }
}

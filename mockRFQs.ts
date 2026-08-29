'use client';

/**
 * ElectroHub — Mock RFQ storage
 * Persists submitted RFQs to localStorage so they survive refresh.
 * Seeded with representative sample RFQs per user on first load.
 * Pattern mirrors mockOrders.ts.
 */

import type { RFQFormData } from '@/types';

// ─── RFQ Status ───────────────────────────────────────────────────────────────

/**
 * Extended status that maps onto the customer-visible timeline:
 *   submitted → under_review → quoted → accepted / rejected → payment → order
 */
export type MockRFQStatus =
  | 'submitted'
  | 'under_review'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'payment_pending'
  | 'order_placed';

// ─── Mock RFQ type ────────────────────────────────────────────────────────────

export interface MockRFQ {
  id:          string;
  rfqNumber:   string;
  userId:      string;

  // Product / requirement
  productType:         'existing' | 'custom';
  productName:         string;   // resolved display name
  existingProductId?:  string;
  referenceUrl?:       string;

  // Requirements
  quantity:          number;
  requiredByDate:    string;   // YYYY-MM-DD
  deliveryLocation:  string;
  budget:            string;
  technicalSpecs:    string;
  additionalNotes:   string;

  // Meta
  status:       MockRFQStatus;
  submittedAt:  string;   // ISO timestamp
  updatedAt:    string;   // ISO timestamp
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const RFQ_KEY = 'electrohub_rfqs';

function getKey(userId: string) {
  return `${RFQ_KEY}_${userId}`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_RFQS: MockRFQ[] = [
  {
    id:                'rfq-seed-001',
    rfqNumber:         'RFQ-2026-000312',
    userId:            '__seed__',
    productType:       'existing',
    productName:       'STM32F407VGT6 ARM Cortex-M4 Microcontroller',
    existingProductId: 'mc-001',
    quantity:          50,
    requiredByDate:    '2026-09-15',
    deliveryLocation:  'Bengaluru, Karnataka 560034',
    budget:            '75000',
    technicalSpecs:
      'STM32F407VGT6, 168 MHz Cortex-M4, 1 MB Flash, 192 KB SRAM. ' +
      'Must support FPU, 3x SPI, 3x I2C, 4x USART, USB OTG FS/HS. ' +
      'Industrial temp range –40°C to +85°C. AEC-Q100 preferred.',
    additionalNotes:   'Bulk packaging preferred. Certificate of conformance required.',
    status:            'quoted',
    submittedAt:       new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt:         new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id:              'rfq-seed-002',
    rfqNumber:       'RFQ-2026-000287',
    userId:          '__seed__',
    productType:     'custom',
    productName:     '48V 20A DC Power Supply (Industrial Grade)',
    referenceUrl:    'https://meanwell.com/productSeries.aspx?i=437',
    quantity:        10,
    requiredByDate:  '2026-10-01',
    deliveryLocation: 'Pune, Maharashtra 411001',
    budget:          '120000',
    technicalSpecs:
      'Input: 90–264 VAC universal. Output: 48 VDC ±1%, 20 A max. ' +
      'Efficiency ≥92%. OVP, OCP, SCP protection. DIN rail mount. ' +
      'CE/UL certified. Operating temp 0–50°C.',
    additionalNotes: 'Prefer Mean Well or equivalent tier-1 brand.',
    status:          'under_review',
    submittedAt:     new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id:              'rfq-seed-003',
    rfqNumber:       'RFQ-2026-000253',
    userId:          '__seed__',
    productType:     'custom',
    productName:     'Custom 2-layer PCB Fabrication (100 × 80 mm)',
    quantity:        200,
    requiredByDate:  '2026-08-30',
    deliveryLocation: 'Hyderabad, Telangana 500032',
    budget:          '15000',
    technicalSpecs:
      'FR4, 1.6 mm thickness, HASL finish. 2 layers, min trace/space 0.15/0.15 mm. ' +
      'Min drill 0.3 mm. Solder mask both sides (green). Silkscreen top only.',
    additionalNotes: 'Gerber files can be shared after RFQ confirmation.',
    status:          'accepted',
    submittedAt:     new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id:              'rfq-seed-004',
    rfqNumber:       'RFQ-2026-000198',
    userId:          '__seed__',
    productType:     'existing',
    productName:     'Raspberry Pi 4 Model B (4 GB RAM)',
    existingProductId: 'rpi-001',
    quantity:        25,
    requiredByDate:  '2026-07-20',
    deliveryLocation: 'Chennai, Tamil Nadu 600001',
    budget:          '140000',
    technicalSpecs:  'Standard unit with 4 GB RAM. Official PSU required. No custom firmware needed.',
    additionalNotes: 'B2B invoice required with GST. Delivery to registered business address only.',
    status:          'order_placed',
    submittedAt:     new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id:              'rfq-seed-005',
    rfqNumber:       'RFQ-2026-000167',
    userId:          '__seed__',
    productType:     'custom',
    productName:     'Hall Effect Current Sensor Module (200 A)',
    quantity:        30,
    requiredByDate:  '2026-08-10',
    deliveryLocation: 'Mumbai, Maharashtra 400001',
    budget:          '45000',
    technicalSpecs:
      'Measurement range ±200 A. Output: analog 0–5 V or I2C. ' +
      'Accuracy ±1%. Supply voltage 5 V. Isolated measurement.',
    additionalNotes: '',
    status:          'rejected',
    submittedAt:     new Date(Date.now() - 22 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export function getStoredRFQs(userId: string): MockRFQ[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (raw) return JSON.parse(raw) as MockRFQ[];

    // Seed on first access
    const seeded = SEED_RFQS.map((r) => ({ ...r, userId }));
    localStorage.setItem(getKey(userId), JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveRFQs(userId: string, rfqs: MockRFQ[]) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(rfqs));
  } catch {
    // ignore
  }
}

/** Append a newly submitted RFQ to the user's local store */
export function addRFQ(userId: string, rfq: MockRFQ) {
  const existing = getStoredRFQs(userId);
  // Prepend so newest appears first
  saveRFQs(userId, [rfq, ...existing]);
}

/** Convert RFQFormData + rfqNumber + timestamp into a storable MockRFQ */
export function formDataToMockRFQ(
  userId: string,
  rfqNumber: string,
  submittedAt: string,
  formData: RFQFormData,
): MockRFQ {
  const productName =
    formData.productType === 'existing'
      ? (formData.existingProductName ?? formData.existingProductId ?? 'Unknown Product')
      : formData.customProductName;

  return {
    id:                `rfq-${Date.now()}`,
    rfqNumber,
    userId,
    productType:       formData.productType,
    productName,
    existingProductId: formData.existingProductId || undefined,
    referenceUrl:      formData.referenceUrl || undefined,
    quantity:          formData.quantity,
    requiredByDate:    formData.requiredByDate,
    deliveryLocation:  formData.deliveryLocation,
    budget:            formData.budget,
    technicalSpecs:    formData.technicalSpecs,
    additionalNotes:   formData.additionalNotes,
    status:            'submitted',
    submittedAt,
    updatedAt:         submittedAt,
  };
}

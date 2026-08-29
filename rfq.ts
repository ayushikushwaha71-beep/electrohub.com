/**
 * ElectroHub — RFQ Mock Data & Helpers
 * Provides a product list for the RFQ form picker and a mock RFQ-number generator.
 * No backend calls — UI only.
 */

import { PRODUCTS } from '@/lib/data/products';
import type { RFQProductOption, RFQSubmission, RFQFormData } from '@/types';

// ─── Product Options for RFQ Picker ──────────────────────────────────────────
export const RFQ_PRODUCT_OPTIONS: RFQProductOption[] = PRODUCTS
  .filter((p) => p.status === 'active')
  .map((p) => ({
    id:           p.id,
    name:         p.name,
    sku:          p.sku,
    sellingPrice: p.sellingPrice,
    brand:        p.brand,
    category:     p.category,
  }));

// ─── RFQ Number Generator ─────────────────────────────────────────────────────
let rfqCounter = Math.floor(Math.random() * 900) + 100;

export function generateRFQNumber(): string {
  const year = new Date().getFullYear();
  const seq  = String(++rfqCounter).padStart(6, '0');
  return `RFQ-${year}-${seq}`;
}

// ─── Mock Submit ──────────────────────────────────────────────────────────────
/** Simulates an async API call; resolves with a mock RFQSubmission after 800 ms */
export function mockSubmitRFQ(formData: RFQFormData): Promise<RFQSubmission> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        rfqNumber:   generateRFQNumber(),
        status:      'under_review',
        submittedAt: new Date().toISOString(),
        formData,
      });
    }, 800);
  });
}

// ─── Default empty form ───────────────────────────────────────────────────────
export const EMPTY_RFQ_FORM: RFQFormData = {
  productType:          'existing',
  existingProductId:    '',
  existingProductName:  '',
  customProductName:    '',
  referenceUrl:         '',
  quantity:             1,
  requiredByDate:       '',
  deliveryLocation:     '',
  budget:               '',
  technicalSpecs:       '',
  additionalNotes:      '',
  hasAttachment:        false,
};

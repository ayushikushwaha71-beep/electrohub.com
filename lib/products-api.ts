import { api } from '@/lib/api';
import type { Product } from '@/types';

interface BackendProduct {
  id: number; name: string; slug: string; category_name: string; brand_name: string | null; sku: string;
  short_description: string; description: string; price: string; discount_price: string | null; final_price: string;
  stock: number; is_featured: boolean; is_trending: boolean; is_active: boolean; status: string;
  images: Array<{ id: number; image: string; alt_text: string; is_primary: boolean }>;
  vendor_id: number; vendor_name: string; created_at: string; updated_at: string;
}
interface ProductResponse { count: number; results: BackendProduct[] }

export function mapBackendProduct(item: BackendProduct): Product {
  const sellingPrice = Number(item.final_price);
  const originalPrice = Number(item.price);
  return {
    id: item.slug, name: item.name, brand: item.brand_name ?? 'Electronics', brandId: String(item.id),
    category: item.category_name || 'Electronics', categoryId: item.category_name || 'electronics', sku: item.sku,
    sellingPrice, originalPrice, discount: originalPrice ? Math.round((1 - sellingPrice / originalPrice) * 100) : 0,
    stock: item.stock, rating: 4.8, reviewCount: 0, shortDescription: item.short_description, fullDescription: item.description,
    specifications: [], features: [], applications: [], packageIncludes: [],
    images: item.images.map((image) => ({ id: String(image.id), url: image.image, alt: image.alt_text, isPrimary: image.is_primary })),
    vendorId: String(item.vendor_id), vendorName: item.vendor_name, vendorRating: 4.8, vendorVerified: true,
    relatedProducts: [], tags: [], isFeatured: item.is_featured, isNew: false, isBestseller: false,
    status: item.status === 'active' ? 'active' : 'inactive', createdAt: item.created_at, updatedAt: item.updated_at,
  };
}

export async function getMarketplaceProducts(): Promise<Product[]> {
  const response = await api.get<ProductResponse>('/products/');
  return response.results.map(mapBackendProduct);
}

export async function getMarketplaceProduct(slug: string): Promise<Product> {
  const response = await api.get<BackendProduct>(`/products/${encodeURIComponent(slug)}/`);
  return mapBackendProduct(response);
}

import { api } from "./api";

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductSpecification {
  id: number;
  key: string;
  value: string;
}

export interface BackendProduct {
  id: number;
  name: string;
  slug: string;

  category: number;
  category_name: string;

  brand: number | null;
  brand_name: string | null;

  sku: string;
  short_description: string;
  description: string;

  price: string;
  discount_price: string | null;
  final_price: string;

  stock: number;
  minimum_stock: number;
  in_stock: boolean;

  weight: string | null;

  is_featured: boolean;
  is_trending: boolean;
  is_active: boolean;

  status: string;

  meta_title: string;
  meta_description: string;

  images: ProductImage[];
  specifications: ProductSpecification[];

  created_at: string;
  updated_at: string;
}

export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendProduct[];
}

export async function getProducts(): Promise<PaginatedProducts> {
  return api.get<PaginatedProducts>("/products/");
}

export async function getProduct(
  slug: string
): Promise<BackendProduct> {
  return api.get<BackendProduct>(`/products/${slug}/`);
}

export async function searchProducts(
  search: string
): Promise<PaginatedProducts> {
  return api.get<PaginatedProducts>(
    `/products/search/?search=${encodeURIComponent(search)}`
  );
}
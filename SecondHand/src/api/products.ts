import type { Product } from '../types';
import { API_ORIGIN, apiRequest } from './client';

type ApiProduct = {
  id: string; title: string; description: string; category: string; subcategory?: string; brand?: string; size: string;
  condition: string; pricePaise: number; imageUrls?: string[]; inventory?: number; createdAt?: string;
};

export function mapApiProduct(value: ApiProduct): Product {
  const images = (value.imageUrls || []).map((url) => /^https?:\/\//i.test(url) ? url : new URL(url, API_ORIGIN).toString());
  const size = value.size.toUpperCase();
  const condition = value.condition === 'very_good' ? 'Very Good' : value.condition.charAt(0).toUpperCase() + value.condition.slice(1);
  return {
    id: value.id, title: value.title, brand: value.brand || 'GOSH Seller', price: value.pricePaise / 100,
    image: images[0] || '', images, category: value.category.toLowerCase(), subcategory: value.subcategory || value.category,
    size, filterSize: size, sizeLabel: size, condition, material: 'Details provided by seller',
    description: value.description, measurements: '', shipping: 'Shipping charged separately',
    isSoldOut: value.inventory === 0,
  };
}

export async function getPublicProducts(): Promise<Product[]> {
  const first = await apiRequest<{ products: ApiProduct[]; pages: number }>('/products?limit=100&page=1');
  const products = [...first.products];
  for (let page = 2; page <= first.pages; page += 1) {
    const next = await apiRequest<{ products: ApiProduct[] }>(`/products?limit=100&page=${page}`);
    products.push(...next.products);
  }
  return products.map(mapApiProduct);
}

export async function getPublicProduct(id: string): Promise<Product> {
  const result = await apiRequest<{ product: ApiProduct }>(`/products/${encodeURIComponent(id)}`);
  return mapApiProduct(result.product);
}

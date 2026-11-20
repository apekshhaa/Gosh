export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  images: string[];
  category: string;
  subcategory: string;
  size: string;
  sizeLabel?: string;
  filterSize?: string;
  condition: string;
  conditionConfirmed?: boolean;
  conditionNote?: string;
  material: string;
  description: string;
  measurements: string;
  shipping: string;
  isCompletedArchive?: boolean;
  isSoldOut?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface Filters {
  category: string;
  subcategory: string;
  size: string[];
  condition: string[];
  searchQuery: string;
}

export type ViewState = 'home' | 'shop' | 'womens' | 'steals' | 'new' | 'wishlist' | 'cart' | 'detail' | 'checkout' | 'account' | 'login' | 'register' | 'about' | 'seller' | 'admin' | 'orders' | 'tracking' | 'faq' | 'contact' | 'shipping' | 'returns' | 'privacy';

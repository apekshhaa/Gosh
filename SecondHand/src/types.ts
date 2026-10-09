export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  images: string[];
  category: 'womens' | 'mens' | 'children' | 'accessories' | 'outerwear' | 'knitwear';
  subcategory: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL';
  sizeLabel?: string;
  filterSize?: string;
  condition: 'Pristine' | 'Excellent' | 'Very Good';
  conditionConfirmed?: boolean;
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
  selectedSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
}

export interface Filters {
  category: string;
  subcategory: string;
  size: string[];
  condition: string[];
  searchQuery: string;
}

export type ViewState = 'home' | 'shop' | 'womens' | 'steals' | 'new' | 'wishlist' | 'cart' | 'detail' | 'checkout' | 'account' | 'login' | 'register' | 'about' | 'tracking' | 'faq' | 'contact' | 'shipping' | 'returns' | 'privacy';

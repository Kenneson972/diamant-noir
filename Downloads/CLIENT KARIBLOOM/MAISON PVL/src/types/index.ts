export type Gender = 'homme' | 'femme';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  gender: Gender;
  category_id: string;
  collection_id: string | null;
  price: number;
  compare_at_price: number | null;
  images: ProductImage[];
  variants: ProductVariant[];
  materials: string | null;
  care_instructions: string | null;
  is_new: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  translations?: Record<string, Partial<ProductTranslation>>;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  position: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  color_hex: string;
  sku: string;
  price: number;
  stock: number;
}

export interface ProductTranslation {
  name: string;
  description: string;
  materials: string;
  care_instructions: string;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  gender: Gender;
  image: string;
  is_featured: boolean;
  order: number;
  translations?: Record<string, Partial<CollectionTranslation>>;
}

export interface CollectionTranslation {
  name: string;
  description: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  gender: Gender;
  translations?: Record<string, Partial<CategoryTranslation>>;
}

export interface CategoryTranslation {
  name: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_intent_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderItem {
  id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  variant_size: string;
  variant_color: string;
  price: number;
  quantity: number;
}

export interface Address {
  id?: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

export interface Return {
  id: string;
  order_id: string;
  status: ReturnStatus;
  items: ReturnItem[];
  reason: string;
  created_at: string;
  updated_at: string;
}

export type ReturnStatus = 'requested' | 'approved' | 'shipped' | 'received' | 'refunded' | 'rejected';

export interface ReturnItem {
  order_item_id: string;
  quantity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
}

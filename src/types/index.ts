export type SupportedLanguage = 'en' | 'sw' | 'lg' | 'zh' | 'es' | 'pt';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  country: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', country: 'Kenya' },
  { code: 'lg', name: 'Luganda', nativeName: 'Luganda (Oluganda)', flag: '🇺🇬', country: 'Uganda' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳', country: 'China' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', country: 'Spain' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', country: 'Portugal' },
];

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  preferredLanguage: SupportedLanguage;
  deliveryAddress?: string;
  county?: string;
  town?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: Record<SupportedLanguage, string>;
  icon: string;
  type: 'product' | 'service' | 'both';
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
  price: number; // in KES
  discountPrice?: number;
  images: string[];
  categoryId: string;
  categoryName?: string;
  stockQuantity: number;
  isAvailable: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  origin: string; // e.g. "Nyeri, Kenya", "Machakos, Kenya"
  weight?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  slug: string;
  name: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
  price: number; // in KES
  duration: string; // e.g. "Full Day", "2 Hours", "Custom Project"
  images: string[];
  categoryId: string;
  categoryName?: string;
  isAvailable: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  provider: string; // e.g. "Zawadi Certified Specialists"
  location: string; // e.g. "Nairobi & Virtual", "Nationwide"
  createdAt: string;
}

export interface CartItem {
  id: string;
  itemId: string;
  itemType: 'product' | 'service';
  name: string;
  price: number;
  quantity: number;
  image: string;
  stockQuantity?: number;
}

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  itemType: 'product' | 'service';
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ZWD-2026-8941"
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  county: string;
  town: string;
  notes?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'mpesa';
  mpesaReceiptNumber?: string;
  checkoutRequestId?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  phoneNumber: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  resultCode?: number;
  resultDesc?: string;
  status: PaymentStatus;
  environment: 'sandbox' | 'production';
  createdAt: string;
  completedAt?: string;
}

export interface MpesaConfigStatus {
  environment: 'sandbox' | 'production';
  hasConsumerKey: boolean;
  hasConsumerSecret: boolean;
  hasShortcode: boolean;
  hasPasskey: boolean;
  hasCallbackUrl: boolean;
  shortcode: string;
  callbackUrl: string;
}

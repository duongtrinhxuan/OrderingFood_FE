// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'restaurant';
  avatar?: string;
  createdAt: string;
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  categories: string[];
  distance: string;
  isOpen: boolean;
  address: string;
  phone: string;
}

// Food types
export interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  restaurant: string;
  restaurantId: string;
  rating: number;
  category: string;
  isAvailable: boolean;
  ingredients?: string[];
  allergens?: string[];
}

// Order types
export interface Order {
  id: string;
  customer: string;
  customerId: string;
  restaurant: string;
  restaurantId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  orderTime: string;
  deliveryTime: string;
  deliveryAddress: string;
  note?: string;
  paymentMethod: PaymentMethod;
  deliveryFee: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'delivering' 
  | 'completed' 
  | 'cancelled';

export type PaymentMethod = 
  | 'cash' 
  | 'momo' 
  | 'zalopay' 
  | 'credit_card' 
  | 'bank_transfer';

// Cart types
export interface CartItem {
  id: string;
  food: Food;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// Review types
export interface Review {
  id: string;
  customer: string;
  customerId: string;
  restaurantId: string;
  orderId: string;
  rating: number;
  comment: string;
  date: string;
  orderItems: string;
  response?: ReviewResponse;
}

export interface ReviewResponse {
  text: string;
  date: string;
}

// Address types
export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export type NotificationType = 
  | 'order_update' 
  | 'promotion' 
  | 'system' 
  | 'review';

// Voucher types
export interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  type: VoucherType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
}

export type VoucherType = 'percentage' | 'fixed_amount' | 'free_delivery';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter types
export interface RestaurantFilters {
  category?: string;
  rating?: number;
  deliveryTime?: string;
  priceRange?: [number, number];
  distance?: number;
  isOpen?: boolean;
}

export interface FoodFilters {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  restaurantId?: string;
  isAvailable?: boolean;
}

// Search types
export interface SearchResult {
  restaurants: Restaurant[];
  foods: Food[];
  total: number;
}

// Analytics types (for restaurant)
export interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  growth: number;
  period: string;
}

export interface TopSellingItem {
  name: string;
  sales: number;
  revenue: number;
}

export interface OrderAnalytics {
  pending: number;
  preparing: number;
  ready: number;
  delivering: number;
  completed: number;
  cancelled: number;
}

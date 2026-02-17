// Extend ProductMedia to include optional file for uploads
export interface ProductMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  file?: File; // For new uploads
}

export interface ProductDiscount {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  media: ProductMedia[];
  visibleOnWebsite: boolean;
  discount?: ProductDiscount;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 
  | 'clothes' 
  | 'shoes' 
  | 'perfumes' 
  | 'creams' 
  | 'watches' 
  | 'jewelry';

export const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'clothes', label: 'Clothes', icon: '👗' },
  { value: 'shoes', label: 'Shoes', icon: '👠' },
  { value: 'perfumes', label: 'Perfumes', icon: '🧴' },
  { value: 'creams', label: 'Creams', icon: '✨' },
  { value: 'watches', label: 'Watches', icon: '⌚' },
  { value: 'jewelry', label: 'Jewelry', icon: '💍' },
];

export type PaymentMethod = 'cash' | 'transfer';

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalAmount: number;
  profit: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  source: 'website';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// Replace your current DashboardStats with this
export interface DashboardStats {
  today: {
    totalSalesAmount: number;
    totalProfit: number;
    transactions: number;
  };
  lowStockCount: number;
  lowStock: LowStockItem[];
  pendingOrdersCount: number;
  pendingOrders: PendingOrderItem[];
}

export interface LowStockItem {
  id: string;
  name: string;
  available: number;
  // Optional fields that might come from the backend
  category?: string;
  sellingPrice?: number;
}

export interface PendingOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  media: ProductMedia[];
  visibleOnWebsite: boolean;
  discount?: ProductDiscount;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    name: string;
    email: string;
    businessName: string;
  };
}

// Form data types - these match what the form collects
export interface ProductFormData {
  name: string;
  description: string;
  category: ProductCategory;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  media: ProductMedia[];  // Now includes optional file property
  visibleOnWebsite: boolean;
  discount?: ProductDiscount;
}

// API request types - these match what the backend expects
export interface ProductApiRequest {
  name: string;
  description: string;
  category: string; // Uppercase
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  visibleOnWebsite: boolean;
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}

// For sending existing media metadata in updates
export interface ExistingMediaMetadata {
  id: string;
  url: string;
  type: 'image' | 'video';
}

export interface SaleFormData {
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  unitPrice: number;
}

// Backend sale request format
export interface SaleApiRequest {
  paymentMethod: string; // Uppercase
  items: Array<{
    productId: string;
    quantity: number;
    sellingPrice: number;
  }>;
}

export type Period = 'daily' | 'weekly' | 'monthly';
export type ReportPeriod = Period | 'custom';

export interface ReportSummary {
  period: ReportPeriod;
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  salesByCategory: Array<{ category: string; amount: number }>;
  salesByPayment: Array<{ method: string; amount: number }>;
  startDate?: string;
  endDate?: string;
}

// API Response wrapper (based on your backend pattern)
export interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
  message?: string;
}
// Extend ProductMedia to include optional file for uploads
export interface ProductMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  file?: File; // For new uploads
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  media: ProductMedia[];
  visibleOnWebsite: boolean;
  discountActive?: boolean;
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  discountValue?: number | null;
  discountStartAt?: string | null;
  discountEndAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// API response type (for reference)
export interface ProductApiResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  discountValue?: number | null;
  discountStartAt?: string | null;  // ISO datetime
  discountEndAt?: string | null;    // ISO datetime
  quantity: number;
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  visibleOnWebsite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = string;

export const DEFAULT_CATEGORIES: { value: string; label: string; icon: string }[] = [
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
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  discountValue?: number | null;
  discountStartAt?: string | null;
  discountEndAt?: string | null;
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

export interface Sale {
  id: string;
  source: 'WALK_IN' | 'WEBSITE';
  orderNumber: string | null;
  customerPhone: string | null;
  receiptNumber: string;
  totalAmount: number;
  profit: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  product: {
    id: string;
    name: string;
    description: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    discountType: string | null;
    discountValue: number | null;
    quantity: number;
    reservedQuantity: number;
    visibleOnWebsite: boolean;
    isArchived: boolean;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Keep this for backward compatibility if needed
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

export interface CategoryRevenue {
  revenue: number;
  profit: number;
}

export interface SourceRevenue {
  revenue: number;
  profit: number;
}

export interface ReportData {
  revenue: number;
  profit: number;
  profitMargin: number;
  byCategory: Record<string, CategoryRevenue>;
  bySource: Record<string, SourceRevenue>;
  transactions: number;
}

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
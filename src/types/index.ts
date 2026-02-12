export interface ProductMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
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

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  lowStockItems: Product[];
  pendingOrders: number;
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

export interface ProductFormData {
  name: string;
  description: string;
  category: ProductCategory;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  media: ProductMedia[];
  visibleOnWebsite: boolean;
  discount?: ProductDiscount;
}

export interface SaleFormData {
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  unitPrice: number;
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

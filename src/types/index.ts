export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
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

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  lowStockItems: Product[];
}

export interface ReportSummary {
  period: string;
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  salesByCategory: { category: string; amount: number }[];
  salesByPayment: { method: string; amount: number }[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    name: string;
    email: string;
    businessName: string;
  };
}

export interface ProductFormData {
  name: string;
  category: ProductCategory;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface SaleFormData {
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
}

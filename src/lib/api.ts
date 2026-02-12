import type {
  Product,
  Sale,
  DashboardStats,
  ReportSummary,
  LoginCredentials,
  AuthResponse,
  ProductFormData,
  SaleFormData,
  Order,
  OrderStatus,
} from '@/types';

// Base API URL - replace with your actual API endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://magic.myradture.com/api/v1";

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

// API helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }

  const result = await response.json();

  // Check for the API success flag and unwrap the data
  if (result.success !== undefined && !result.success) {
    throw new Error(result.message || 'API request failed');
  }

  // Automatically return the data object if it exists in the response
  // Otherwise return the full response
  return result.data !== undefined ? result.data as T : result as T;
};

// ============================================
// MOCK DATA (Remove when connecting to real API)
// ============================================
const mockProducts: Product[] = [
  { id: '1', name: 'Ankara Midi Dress', description: 'Beautiful traditional Ankara midi dress', category: 'clothes', costPrice: 8000, sellingPrice: 15000, quantity: 12, media: [], visibleOnWebsite: true, discount: { type: 'percentage', value: 10 }, createdAt: '2026-02-01', updatedAt: '2026-02-05' },
  { id: '2', name: 'Designer Stilettos', description: 'Elegant designer stiletto heels', category: 'shoes', costPrice: 12000, sellingPrice: 22000, quantity: 5, media: [], visibleOnWebsite: true, createdAt: '2026-02-01', updatedAt: '2026-02-04' },
  { id: '3', name: 'Tom Ford Noir', description: 'Premium luxury perfume by Tom Ford', category: 'perfumes', costPrice: 25000, sellingPrice: 45000, quantity: 3, media: [], visibleOnWebsite: false, createdAt: '2026-02-02', updatedAt: '2026-02-03' },
  { id: '4', name: 'Shea Butter Cream', description: 'Natural shea butter moisturizing cream', category: 'creams', costPrice: 2000, sellingPrice: 4500, quantity: 20, media: [], visibleOnWebsite: true, discount: { type: 'fixed', value: 500 }, createdAt: '2026-02-01', updatedAt: '2026-02-05' },
  { id: '5', name: 'Gold Wrist Watch', description: 'Elegant gold-plated wrist watch', category: 'watches', costPrice: 15000, sellingPrice: 28000, quantity: 2, media: [], visibleOnWebsite: true, createdAt: '2026-02-03', updatedAt: '2026-02-05' },
  { id: '6', name: 'Pearl Necklace Set', description: 'Stunning pearl necklace jewelry set', category: 'jewelry', costPrice: 5000, sellingPrice: 12000, quantity: 8, media: [], visibleOnWebsite: true, createdAt: '2026-02-01', updatedAt: '2026-02-04' },
  { id: '7', name: 'Lace Blouse', description: 'Elegant lace blouse for women', category: 'clothes', costPrice: 5000, sellingPrice: 9500, quantity: 15, media: [], visibleOnWebsite: false, createdAt: '2026-02-02', updatedAt: '2026-02-05' },
  { id: '8', name: 'Sneakers Classic', description: 'Classic comfortable sneakers', category: 'shoes', costPrice: 8000, sellingPrice: 16000, quantity: 4, media: [], visibleOnWebsite: true, createdAt: '2026-02-01', updatedAt: '2026-02-05' },
  { id: '9', name: 'Body Mist Spray', description: 'Refreshing fragrant body mist spray', category: 'perfumes', costPrice: 3500, sellingPrice: 7000, quantity: 10, media: [], visibleOnWebsite: true, createdAt: '2026-02-03', updatedAt: '2026-02-05' },
  { id: '10', name: 'Silver Ring Set', description: 'Beautiful silver ring jewelry set', category: 'jewelry', costPrice: 3000, sellingPrice: 7500, quantity: 6, media: [], visibleOnWebsite: true, createdAt: '2026-02-02', updatedAt: '2026-02-04' },
];

const mockSales: Sale[] = [
  { id: 's1', productId: '1', productName: 'Ankara Midi Dress', quantity: 2, unitPrice: 15000, costPrice: 8000, totalAmount: 30000, profit: 14000, paymentMethod: 'cash', createdAt: '2026-02-06T09:30:00' },
  { id: 's2', productId: '3', productName: 'Tom Ford Noir', quantity: 1, unitPrice: 45000, costPrice: 25000, totalAmount: 45000, profit: 20000, paymentMethod: 'transfer', createdAt: '2026-02-06T10:15:00' },
  { id: 's3', productId: '6', productName: 'Pearl Necklace Set', quantity: 1, unitPrice: 12000, costPrice: 5000, totalAmount: 12000, profit: 7000, paymentMethod: 'cash', createdAt: '2026-02-06T11:00:00' },
  { id: 's4', productId: '4', productName: 'Shea Butter Cream', quantity: 3, unitPrice: 4500, costPrice: 2000, totalAmount: 13500, profit: 7500, paymentMethod: 'transfer', createdAt: '2026-02-05T14:00:00' },
  { id: 's5', productId: '7', productName: 'Lace Blouse', quantity: 1, unitPrice: 9500, costPrice: 5000, totalAmount: 9500, profit: 4500, paymentMethod: 'cash', createdAt: '2026-02-05T16:30:00' },
];

const mockOrders: Order[] = [
  {
    id: 'o1', orderNumber: 'JDC-0001', customerName: 'Ada Okonkwo', customerPhone: '08012345678',
    items: [{ productId: '1', productName: 'Ankara Midi Dress', quantity: 1, unitPrice: 13500 }],
    totalAmount: 13500, source: 'website', status: 'pending', createdAt: '2026-02-06T08:00:00', updatedAt: '2026-02-06T08:00:00',
  },
  {
    id: 'o2', orderNumber: 'JDC-0002', customerName: 'Chika Eze', customerPhone: '08098765432',
    items: [
      { productId: '6', productName: 'Pearl Necklace Set', quantity: 2, unitPrice: 12000 },
      { productId: '9', productName: 'Body Mist Spray', quantity: 1, unitPrice: 7000 },
    ],
    totalAmount: 31000, source: 'website', status: 'paid', createdAt: '2026-02-05T15:30:00', updatedAt: '2026-02-06T09:00:00',
  },
  {
    id: 'o3', orderNumber: 'JDC-0003', customerName: 'Funke Adeyemi', customerPhone: '07011223344',
    items: [{ productId: '2', productName: 'Designer Stilettos', quantity: 1, unitPrice: 22000 }],
    totalAmount: 22000, source: 'website', status: 'completed', createdAt: '2026-02-04T12:00:00', updatedAt: '2026-02-05T14:00:00',
  },
  {
    id: 'o4', orderNumber: 'JDC-0004', customerName: 'Ngozi Obi', customerPhone: '09033445566',
    items: [{ productId: '4', productName: 'Shea Butter Cream', quantity: 5, unitPrice: 4000 }],
    totalAmount: 20000, source: 'website', status: 'pending', createdAt: '2026-02-06T10:00:00', updatedAt: '2026-02-06T10:00:00',
  },
];

let nextProductId = 11;
let nextSaleId = 6;

const USE_MOCK = false; // Set to false when connecting to real API
// ============================================

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 800));
      if (credentials.email === 'admin@jossydiva.com' && credentials.password === 'admin123') {
        const response: AuthResponse = {
          accessToken: 'mock-jwt-token-jossy-diva',
          user: { name: 'Jossy', email: 'admin@jossydiva.com', businessName: 'Jossy-Diva Collections' },
        };
        setAuthToken(response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      }
      throw new Error('Invalid email or password');
    }
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  },

  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('user');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!getAuthToken(),
};

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return [...mockProducts];
    }
    return apiRequest<Product[]>('/products');
  },

  getById: async (id: string): Promise<Product> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200));
      const product = mockProducts.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return { ...product };
    }
    return apiRequest<Product>(`/products/${id}`);
  },

  create: async (data: ProductFormData): Promise<Product> => {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    const product: Product = {
      id: String(nextProductId++),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProducts.push(product);
    return product;
  }
  
  console.log('Form data received:', data); // Debug
  
  const apiData: any = {
    name: data.name,
    description: data.description || '',
    category: data.category.toUpperCase(),
    costPrice: data.costPrice,
    sellingPrice: data.sellingPrice,
    quantity: data.quantity,
    visibleOnWebsite: data.visibleOnWebsite ?? false,
  };
  
  if (data.discount && data.discount.type && data.discount.value !== undefined) {
    apiData.discountType = data.discount.type.toUpperCase();
    apiData.discountValue = data.discount.value;
  } else {
    apiData.discountType = null;
    apiData.discountValue = null;
  }
  
  console.log('Sending to API:', apiData); // Debug
  
  return apiRequest<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(apiData),
  });
},

update: async (
  id: string,
  data: Partial<ProductFormData>,
  existing: Product // 👈 pass current product
): Promise<Product> => {

  const apiData = {
    name: (data.name ?? existing.name).trim(),
    description: (data.description ?? existing.description).trim(),
    category: (data.category ?? existing.category).toUpperCase(),
    costPrice: Number(data.costPrice ?? existing.costPrice),
    sellingPrice: Number(data.sellingPrice ?? existing.sellingPrice),
    quantity: Number(data.quantity ?? existing.quantity),
    visibleOnWebsite: data.visibleOnWebsite ?? existing.visibleOnWebsite,
    discountType: 'NONE',
    discountValue: 0,
  };

  if (data.discount && data.discount.value > 0) {
    apiData.discountType = data.discount.type.toUpperCase();
    apiData.discountValue = Number(data.discount.value);
  } else if (existing.discount) {
    apiData.discountType = existing.discount.type.toUpperCase();
    apiData.discountValue = existing.discount.value;
  }

  return apiRequest<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(apiData),
  });
},

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      const index = mockProducts.findIndex(p => p.id === id);
      if (index !== -1) mockProducts.splice(index, 1);
      return;
    }
    await apiRequest(`/products/${id}`, { method: 'DELETE' });
  },
};

// Sales API
export const salesApi = {
  create: async (data: SaleFormData): Promise<Sale> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      const product = mockProducts.find(p => p.id === data.productId);
      if (!product) throw new Error('Product not found');
      if (product.quantity < data.quantity) throw new Error('Insufficient stock');

      const unitPrice = data.unitPrice;
      const sale: Sale = {
        id: `s${nextSaleId++}`,
        productId: product.id,
        productName: product.name,
        quantity: data.quantity,
        unitPrice,
        costPrice: product.costPrice,
        totalAmount: unitPrice * data.quantity,
        profit: (unitPrice - product.costPrice) * data.quantity,
        paymentMethod: data.paymentMethod,
        createdAt: new Date().toISOString(),
      };

      // Update stock
      product.quantity -= data.quantity;
      mockSales.push(sale);
      return sale;
    }
    return apiRequest<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (): Promise<Sale[]> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return [...mockSales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return apiRequest<Sale[]>('/sales');
  },
};

// Orders API
export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return [...mockOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return apiRequest<Order[]>('/orders');
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      const index = mockOrders.findIndex(o => o.id === id);
      if (index === -1) throw new Error('Order not found');

      const order = mockOrders[index];

      // Deduct inventory when marking as paid
      if (status === 'paid' && order.status === 'pending') {
        for (const item of order.items) {
          const product = mockProducts.find(p => p.id === item.productId);
          if (product) {
            if (product.quantity < item.quantity) {
              throw new Error(`Insufficient stock for ${item.productName}`);
            }
            product.quantity -= item.quantity;
          }
        }
      }

      mockOrders[index] = { ...order, status, updatedAt: new Date().toISOString() };
      return { ...mockOrders[index] };
    }
    return apiRequest<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getPendingCount: async (): Promise<number> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100));
      return mockOrders.filter(o => o.status === 'pending').length;
    }
    return apiRequest<number>('/orders/pending-count');
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      const today = new Date().toISOString().split('T')[0];
      const todaySales = mockSales.filter(s => s.createdAt.startsWith(today));
      const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;

      return {
        todaySales: todaySales.reduce((sum, s) => sum + s.totalAmount, 0),
        todayProfit: todaySales.reduce((sum, s) => sum + s.profit, 0),
        todayTransactions: todaySales.length,
        lowStockItems: mockProducts.filter(p => p.quantity <= 5),
        pendingOrders,
      };
    }
    return apiRequest<DashboardStats>('/dashboard');
  },
};


// Reports API - Fixed
export const reportsApi = {
  getSummary: async (period: 'daily' | 'weekly' | 'monthly'): Promise<ReportSummary> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      const now = new Date();
      let filteredSales = mockSales;

      if (period === 'daily') {
        const today = now.toISOString().split('T')[0];
        filteredSales = mockSales.filter(s => s.createdAt.startsWith(today));
      } else if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredSales = mockSales.filter(s => new Date(s.createdAt) >= weekAgo);
      }

      const salesByCategory: Record<string, number> = {};
      const salesByPayment: Record<string, number> = {};

      filteredSales.forEach(sale => {
        const product = mockProducts.find(p => p.id === sale.productId);
        const cat = product?.category || 'other';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + sale.totalAmount;
        salesByPayment[sale.paymentMethod] = (salesByPayment[sale.paymentMethod] || 0) + sale.totalAmount;
      });

      return {
        period,
        totalSales: filteredSales.reduce((sum, s) => sum + s.totalAmount, 0),
        totalProfit: filteredSales.reduce((sum, s) => sum + s.profit, 0),
        totalTransactions: filteredSales.length,
        salesByCategory: Object.entries(salesByCategory).map(([category, amount]) => ({ category, amount })),
        salesByPayment: Object.entries(salesByPayment).map(([method, amount]) => ({ method, amount })),
      };
    }

    const endpoint = `/reports/${period}`;
    return apiRequest<ReportSummary>(endpoint);
  },
  
  getCustomReport: async (startDate: string, endDate: string): Promise<ReportSummary> => {
    return apiRequest<ReportSummary>(`/reports/custom?startDate=${startDate}&endDate=${endDate}`);
  },

  exportReport: async (format: 'pdf'): Promise<Blob> => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      return new Blob(['Mock PDF content'], { type: 'application/pdf' });
    }
    const response = await fetch(`${API_BASE_URL}/reports/export/${format}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    if (!response.ok) throw new Error('Failed to export report');
    return response.blob();
  }
};
// Currency formatter for Naira
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate discounted price
export const getDiscountedPrice = (product: Product): number | null => {
  if (!product.discount) return null;
  if (product.discount.type === 'percentage') {
    return Math.round(product.sellingPrice * (1 - product.discount.value / 100));
  }
  return product.sellingPrice - product.discount.value;
};

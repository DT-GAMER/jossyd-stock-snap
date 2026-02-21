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
  ReportData,
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

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
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
    const response = await apiRequest<any>('/products');
    const productsData = response.data || response;
    
    return productsData.map((p: any) => transformProduct(p));
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiRequest<any>(`/products/${id}`);
    const productData = response.data || response;
    return transformProduct(productData);
  },

  create: async (data: ProductFormData & { 
    discountType?: string; 
    discountValue?: number; 
    discountStartAt?: string; 
    discountEndAt?: string;
    newFiles?: { file: File; type: string }[];
  }): Promise<Product> => {
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('category', data.category.toUpperCase());
    formData.append('costPrice', String(data.costPrice));
    formData.append('sellingPrice', String(data.sellingPrice));
    formData.append('quantity', String(data.quantity));
    formData.append('visibleOnWebsite', String(data.visibleOnWebsite ?? false));

    // Add discount fields if they exist - using root level fields, not nested discount object
    if (data.discountType && data.discountValue && data.discountValue > 0) {
      formData.append('discountType', data.discountType.toUpperCase());
      formData.append('discountValue', String(data.discountValue));
      
      // Add discount dates if provided
      if (data.discountStartAt) {
        formData.append('discountStartAt', data.discountStartAt);
      } else {
        formData.append('discountStartAt', '');
      }
      
      if (data.discountEndAt) {
        formData.append('discountEndAt', data.discountEndAt);
      } else {
        formData.append('discountEndAt', '');
      }
    } else {
      // Send empty values as shown in Swagger
      formData.append('discountType', '');
      formData.append('discountValue', '');
      formData.append('discountStartAt', '');
      formData.append('discountEndAt', '');
    }

    // Handle media files
    if (data.media) {
      const filesToUpload = data.media.filter(m => m.file);
      filesToUpload.forEach((media) => {
        const file = media.file as File;
        formData.append('files', file);
      });
    }

    // Handle newFiles if passed separately
    if (data.newFiles && data.newFiles.length > 0) {
      data.newFiles.forEach((item) => {
        formData.append('files', item.file);
      });
    }

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Product creation failed: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    const productData = result.data || result;
    
    return transformProduct(productData);
  },

  update: async (
    id: string,
    data: Partial<ProductFormData> & { 
      newFiles?: { file: File; type: string }[];
      discountStartAt?: string;
      discountEndAt?: string;
    },
    existing: Product
  ): Promise<Product> => {
    const formData = new FormData();

    // Add JSON fields as form fields
    formData.append('name', data.name || existing.name);
    formData.append('description', data.description || existing.description);
    formData.append('category', (data.category || existing.category).toUpperCase());

    if (data.costPrice !== undefined && data.costPrice !== existing.costPrice) {
      formData.append('costPrice', String(data.costPrice));
    }

    formData.append('sellingPrice', String(data.sellingPrice || existing.sellingPrice));
    formData.append('quantity', String(data.quantity || existing.quantity));
    formData.append('visibleOnWebsite', String(data.visibleOnWebsite ?? existing.visibleOnWebsite));

    // Handle discount
    if (data.discountType && data.discountValue && data.discountValue > 0) {
      formData.append('discountType', data.discountType.toUpperCase());
      formData.append('discountValue', String(data.discountValue));
      
      // Add discount dates if provided
      if (data.discountStartAt !== undefined) {
        formData.append('discountStartAt', data.discountStartAt);
      } else {
        formData.append('discountStartAt', '');
      }
      
      if (data.discountEndAt !== undefined) {
        formData.append('discountEndAt', data.discountEndAt);
      } else {
        formData.append('discountEndAt', '');
      }
    } else if (existing.discountType && existing.discountValue) {
      // Send empty to remove discount
      formData.append('discountType', '');
      formData.append('discountValue', '');
      formData.append('discountStartAt', '');
      formData.append('discountEndAt', '');
    }

    // Add new files if any
    if (data.newFiles && data.newFiles.length > 0) {
      data.newFiles.forEach((item) => {
        formData.append('files', item.file);
      });
    }

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Product update failed: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    const productData = result.data || result;
    
    return transformProduct(productData);
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/products/${id}`, { method: 'DELETE' });
  },

  getCategories: async (): Promise<{ value: string; label: string; icon: string }[]> => {
    const response = await apiRequest<any>('/products/categories');
    const categoriesData = response.data || response;

    return categoriesData.map((cat: any) => ({
      value: cat.value?.toLowerCase() || cat,
      label: cat.label || cat,
      icon: cat.icon || '📦',
    }));
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete media: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Media deletion error:', error);
      throw error;
    }
  },
};

// Helper function to transform API response to Product type
function transformProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    category: p.category?.toLowerCase() || '',
    costPrice: p.costPrice || 0,
    sellingPrice: p.sellingPrice || 0,
    quantity: p.quantity || 0,
    media: Array.isArray(p.media) ? p.media.map((m: any) => ({
      id: m.id,
      url: m.url,
      type: m.type?.toLowerCase() || 'image',
    })) : [],
    visibleOnWebsite: p.visibleOnWebsite || false,
    discountType: p.discountType || null,
    discountValue: p.discountValue || null,
    discountStartAt: p.discountStartAt || null,
    discountEndAt: p.discountEndAt || null,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  };
}
// Sales API
export const salesApi = {
  create: async (data: SaleFormData): Promise<Sale> => {
    const payload = {
      paymentMethod: data.paymentMethod.toUpperCase(),
      items: [
        {
          productId: data.productId,
          quantity: Number(data.quantity),
          sellingPrice: Number(data.unitPrice),
        },
      ],
    };

    return apiRequest<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getAll: async (): Promise<Sale[]> => {
    return apiRequest<Sale[]>('/sales');
  },

  downloadReceipt: async (saleId: string): Promise<Blob> => {
    const url = `${API_BASE_URL}/receipts/sale/${saleId}`;

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });


      if (!response.ok) {
        let errorDetails = '';
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson);
        } else {
          errorDetails = await response.text();
        }

        throw new Error(`Failed to download sale receipt (${response.status}): ${errorDetails}`);
      }

      // Verify content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        console.warn('⚠️ Response is not PDF, content-type:', contentType);
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Sale receipt download error:', error);
      throw error;
    }
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: { 
  search?: string; 
  status?: string; 
  startDate?: string; 
  endDate?: string; 
  date?: string; 
  today?: boolean;
}): Promise<Order[]> => {
  // Build query string from params
  const queryParams = new URLSearchParams();
  
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  
  if (params?.status && params.status !== 'all') {
    queryParams.append('status', params.status.toUpperCase());
  }
  
  if (params?.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  
  if (params?.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  if (params?.date) {
    queryParams.append('date', params.date);
  }
  
  if (params?.today) {
    queryParams.append('today', 'true');
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/orders?${queryString}` : '/orders';

  const response = await apiRequest<any>(url);

  // Handle the response structure (it might be wrapped in a data property)
  const ordersData = response.data || response;

  if (!Array.isArray(ordersData)) {
    return [];
  }

  // Transform each order to match your Order type
  return ordersData.map((order: any) => {
    // Map backend status to frontend status
    let frontendStatus: OrderStatus = 'pending';
    const backendStatus = order.status?.toUpperCase() || '';

    if (backendStatus === 'PENDING_PAYMENT') {
      frontendStatus = 'pending';
    } else if (backendStatus === 'PAID') {
      frontendStatus = 'paid';
    } else if (backendStatus === 'COMPLETED') {
      frontendStatus = 'completed';
    } else if (backendStatus === 'CANCELLED') {
      frontendStatus = 'cancelled';
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.phone || order.customerPhone,
      items: (order.items || []).map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name || item.productName || 'Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.priceAtOrder || item.price || 0,
      })),
      totalAmount: order.totalAmount,
      source: (order.source || 'website').toLowerCase(),
      status: frontendStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });
},

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    // Map frontend status to backend status
    let backendStatus = '';
    if (status === 'pending') {
      backendStatus = 'PENDING_PAYMENT';
    } else if (status === 'paid') {
      backendStatus = 'PAID';
    } else if (status === 'completed') {
      backendStatus = 'COMPLETED';
    } else if (status === 'cancelled') {
      backendStatus = 'CANCELLED';
    }

    const response = await apiRequest<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: backendStatus }),
    });

    const orderData = response.data || response;

    // Map backend status back to frontend status
    let frontendStatus: OrderStatus = 'pending';
    const responseStatus = orderData.status?.toUpperCase() || '';

    if (responseStatus === 'PENDING_PAYMENT') {
      frontendStatus = 'pending';
    } else if (responseStatus === 'PAID') {
      frontendStatus = 'paid';
    } else if (responseStatus === 'COMPLETED') {
      frontendStatus = 'completed';
    } else if (responseStatus === 'CANCELLED') {
      frontendStatus = 'cancelled';
    }

    return {
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      customerPhone: orderData.phone || orderData.customerPhone,
      items: (orderData.items || []).map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name || item.productName || 'Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.priceAtOrder || item.price || 0,
      })),
      totalAmount: orderData.totalAmount,
      source: (orderData.source || 'website').toLowerCase(),
      status: frontendStatus,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
    };
  },

  getByOrderNumber: async (orderNumber: string): Promise<Order> => {

    const response = await apiRequest<any>(`/orders/${orderNumber}`);

    const orderData = response.data || response;

    // Map backend status to frontend status
    let frontendStatus: OrderStatus = 'pending';
    const backendStatus = orderData.status?.toUpperCase() || '';

    if (backendStatus === 'PENDING_PAYMENT') {
      frontendStatus = 'pending';
    } else if (backendStatus === 'PAID') {
      frontendStatus = 'paid';
    } else if (backendStatus === 'COMPLETED') {
      frontendStatus = 'completed';
    } else if (backendStatus === 'CANCELLED') {
      frontendStatus = 'cancelled';
    }

    return {
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      customerPhone: orderData.phone || orderData.customerPhone,
      items: (orderData.items || []).map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name || item.productName || 'Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.priceAtOrder || item.price || 0,
      })),
      totalAmount: orderData.totalAmount,
      source: (orderData.source || 'website').toLowerCase(),
      status: frontendStatus,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
    };
  },

  getPendingCount: async (): Promise<number> => {
    const response = await apiRequest<any>('/orders/pending-count');
    return response.data || response;
  },

  downloadReceipt: async (orderNumber: string): Promise<Blob> => {
    const url = `${API_BASE_URL}/receipts/order/${orderNumber}`;

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let errorDetails = '';
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson);
        } else {
          errorDetails = await response.text();
        }

        throw new Error(`Failed to download receipt (${response.status}): ${errorDetails}`);
      }

      // Verify content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        console.warn('⚠️ Response is not PDF, content-type:', contentType);
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Receipt download error:', error);
      throw error;
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest<any>('/dashboard');

    // Handle response wrapper
    const data = response.data || response;

    // Return the data as-is since it already matches the type
    return {
      today: data.today || { totalSalesAmount: 0, totalProfit: 0, transactions: 0 },
      lowStockCount: data.lowStockCount || 0,
      lowStock: data.lowStock || [],
      pendingOrdersCount: data.pendingOrdersCount || 0,
      pendingOrders: data.pendingOrders || [],
    };
  },
};


// Reports API
export const reportsApi = {
  // Get daily report
  getDaily: async (): Promise<ReportData> => {
    const response = await apiRequest<any>('/reports/daily');
    return response.data || response;
  },

  // Get weekly report
  getWeekly: async (): Promise<ReportData> => {
    const response = await apiRequest<any>('/reports/weekly');
    return response.data || response;
  },

  // Get monthly report
  getMonthly: async (): Promise<ReportData> => {
    const response = await apiRequest<any>('/reports/monthly');
    return response.data || response;
  },

  // Get custom report
  getCustomReport: async (startDate: string, endDate: string): Promise<ReportData> => {
    const response = await apiRequest<any>(`/reports/custom?startDate=${startDate}&endDate=${endDate}`);
    return response.data || response;
  },

  // Export report as PDF
  exportReport: async (startDate: string, endDate: string): Promise<Blob> => {
    const url = `${API_BASE_URL}/reports/export/pdf?startDate=${startDate}&endDate=${endDate}`;

    const response = await fetch(url, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Export failed:', errorText);
      throw new Error('Failed to export report');
    }

    return response.blob();
  },

  // For backward compatibility with your existing UI
  getSummary: async (period: 'daily' | 'weekly' | 'monthly'): Promise<ReportSummary> => {
    let reportData: ReportData;

    if (period === 'daily') {
      reportData = await reportsApi.getDaily();
    } else if (period === 'weekly') {
      reportData = await reportsApi.getWeekly();
    } else {
      reportData = await reportsApi.getMonthly();
    }

    // Transform to the format your UI expects
    return {
      period,
      totalSales: reportData.revenue,
      totalProfit: reportData.profit,
      totalTransactions: reportData.transactions,
      salesByCategory: Object.entries(reportData.byCategory).map(([category, data]) => ({
        category: category.toLowerCase(),
        amount: data.revenue,
      })),
      salesByPayment: Object.entries(reportData.bySource).map(([source, data]) => ({
        method: source.toLowerCase().replace('_', ' '),
        amount: data.revenue,
      })),
    };
  },
};

// ============ PROFILE ENDPOINTS ============

// Add to your existing api.ts file

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export const profileApi = {
  // Get current user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiRequest<any>('/auth/me');
    
    const profileData = response.data || response;
    
    return {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      role: profileData.role,
      bankName: profileData.bankName,
      accountName: profileData.accountName,
      accountNumber: profileData.accountNumber,
    };
  },

  // Update profile (PUT - full update)
  updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiRequest<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    
    const profileData = response.data || response;
    return profileData;
  },

  // Patch profile (PATCH - partial update)
  patchProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiRequest<any>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
    
    const profileData = response.data || response;
    return profileData;
  },
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
  if (!product.discountValue) return null;
  if (product.discountType === 'PERCENTAGE') {
    return Math.round(product.sellingPrice * (1 - product.discountValue / 100));
  }
  return product.sellingPrice - product.discountValue;
};

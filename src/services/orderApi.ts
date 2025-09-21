import { apiClient } from './apiClient';
import type { Order, OrderItem } from '@/types/orders';

export interface CreateOrderRequest {
  type: 'purchase' | 'sales';
  supplier?: string;
  customer?: string;
  items: {
    product: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  expectedDate?: Date;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  paymentMethod?: 'cash' | 'transfer' | 'credit' | 'check';
  tax?: number;
  shipping?: number;
  notes?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  type?: 'purchase' | 'sales';
  status?: 'draft' | 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  search?: string;
}

export class OrderApiService {
  async getOrders(filters: OrderFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    return await apiClient.get(`/api/orders?${params}`);
  }

  async getOrder(id: string) {
    return await apiClient.get(`/api/orders/${id}`);
  }

  async createOrder(data: CreateOrderRequest) {
    return await apiClient.post('/api/orders', data);
  }

  async updateOrder(id: string, data: Partial<CreateOrderRequest>) {
    return await apiClient.put(`/api/orders/${id}`, data);
  }

  async approveOrder(id: string) {
    return await apiClient.patch(`/api/orders/${id}/approve`);
  }

  async cancelOrder(id: string) {
    return await apiClient.patch(`/api/orders/${id}/cancel`);
  }

  async deleteOrder(id: string) {
    return await apiClient.delete(`/api/orders/${id}`);
  }
}

export const orderApi = new OrderApiService();
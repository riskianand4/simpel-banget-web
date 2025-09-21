import { apiClient } from './apiClient';
import type { Customer } from '@/types/orders';

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  type: 'individual' | 'corporate';
  status?: 'active' | 'inactive' | 'blocked';
  creditLimit?: number;
  paymentTerms?: 'Cash' | 'Net 30' | 'Net 60' | 'COD';
  taxId?: string;
  companyDetails?: {
    companyName?: string;
    industry?: string;
    website?: string;
  };
  notes?: string;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  type?: 'individual' | 'corporate';
  status?: 'active' | 'inactive' | 'blocked';
  search?: string;
}

export class CustomerApiService {
  async getCustomers(filters: CustomerFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    return await apiClient.get(`/api/customers?${params}`);
  }

  async getCustomer(id: string) {
    return await apiClient.get(`/api/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerRequest) {
    return await apiClient.post('/api/customers', data);
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerRequest>) {
    return await apiClient.put(`/api/customers/${id}`, data);
  }

  async deleteCustomer(id: string) {
    return await apiClient.delete(`/api/customers/${id}`);
  }

  async toggleCustomerStatus(id: string) {
    return await apiClient.patch(`/api/customers/${id}/toggle-status`);
  }
}

export const customerApi = new CustomerApiService();
import { apiClient } from './apiClient';
import type { Supplier } from '@/types/orders';

export interface CreateSupplierRequest {
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
  contactPerson: string;
  paymentTerms?: 'Cash' | 'Net 30' | 'Net 60' | 'Net 90' | 'COD';
  status?: 'active' | 'inactive' | 'suspended';
  rating?: number;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    swiftCode?: string;
  };
  taxId?: string;
  website?: string;
  notes?: string;
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
}

export class SupplierApiService {
  async getSuppliers(filters: SupplierFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    return await apiClient.get(`/api/suppliers?${params}`);
  }

  async getSupplier(id: string) {
    return await apiClient.get(`/api/suppliers/${id}`);
  }

  async createSupplier(data: CreateSupplierRequest) {
    return await apiClient.post('/api/suppliers', data);
  }

  async updateSupplier(id: string, data: Partial<CreateSupplierRequest>) {
    return await apiClient.put(`/api/suppliers/${id}`, data);
  }

  async deleteSupplier(id: string) {
    return await apiClient.delete(`/api/suppliers/${id}`);
  }

  async toggleSupplierStatus(id: string) {
    return await apiClient.patch(`/api/suppliers/${id}/toggle-status`);
  }
}

export const supplierApi = new SupplierApiService();
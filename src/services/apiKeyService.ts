import { apiClient } from './apiClient';

export interface ApiKeyData {
  id: string;
  name: string;
  key?: string;
  permissions: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  rateLimit: number;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresAt?: string;
}

export interface ApiKeyUsage {
  totalUsage: number;
  recentUsage: number;
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
  dailyUsage: {
    date: string;
    count: number;
    endpoints: Record<string, number>;
  }[];
  lastUsed: Date | null;
}

export class ApiKeyService {
  
  async getApiKeys(page = 1, limit = 20, active?: boolean) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (active !== undefined) {
      params.append('active', active.toString());
    }
    
    try {
      return await apiClient.get(`/api/admin/api-keys?${params}`);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      throw error;
    }
  }

  async getApiKey(id: string) {
    return await apiClient.get(`/api/admin/api-keys/${id}`);
  }

  async createApiKey(data: CreateApiKeyRequest) {
    return await apiClient.post('/api/admin/api-keys', data);
  }

  async updateApiKey(id: string, data: Partial<CreateApiKeyRequest>) {
    return await apiClient.put(`/api/admin/api-keys/${id}`, data);
  }

  async toggleApiKeyStatus(id: string) {
    return await apiClient.patch(`/api/admin/api-keys/${id}/toggle`);
  }

  async deleteApiKey(id: string) {
    return await apiClient.delete(`/api/admin/api-keys/${id}`);
  }

  async regenerateApiKey(id: string) {
    return await apiClient.post(`/api/admin/api-keys/${id}/regenerate`);
  }

  async getApiKeyUsage(id: string, days = 30) {
    const params = new URLSearchParams({ days: days.toString() });
    return await apiClient.get(`/api/admin/api-keys/${id}/usage?${params}`);
  }

  async testExternalApi(apiKey: string) {
    try {
      const baseURL = apiClient.getBaseURL();
      const response = await fetch(`${baseURL}/api/external/health`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      throw new Error('Failed to test external API');
    }
  }
}

export const apiKeyService = new ApiKeyService();
import { apiClient } from './apiClient';

export interface CreateAlertRequest {
  type: string;
  severity: string;
  title: string;
  message: string;
  category: string;
  product?: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  category: string;
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface AlertResponse {
  success: boolean;
  data: Alert;
  message: string;
}

export class AlertApiService {
  async createAlert(alertData: CreateAlertRequest): Promise<AlertResponse> {
    try {
      // Creating alert via API
      const response = await apiClient.post('/api/alerts', alertData);
      return response.data as AlertResponse;
    } catch (error: any) {
      // Alert API Error
      throw new Error(error.response?.data?.error || 'Failed to create alert');
    }
  }

  async getAlerts(params?: {
    type?: string;
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
    page?: number;
  }): Promise<{ success: boolean; data: Alert[] }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const response = await apiClient.get(`/api/alerts?${queryParams.toString()}`);
      return response.data as { success: boolean; data: Alert[] };
    } catch (error: any) {
      // Get alerts error
      throw new Error(error.response?.data?.error || 'Failed to get alerts');
    }
  }

  async acknowledgeAlert(alertId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch(`/api/alerts/${alertId}/acknowledge`);
      return response.data as { success: boolean };
    } catch (error: any) {
      // Acknowledge alert error
      throw new Error(error.response?.data?.error || 'Failed to acknowledge alert');
    }
  }

  async resolveAlert(alertId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch(`/api/alerts/${alertId}/resolve`);
      return response.data as { success: boolean };
    } catch (error: any) {
      // Resolve alert error
      throw new Error(error.response?.data?.error || 'Failed to resolve alert');
    }
  }
}

export const alertApiService = new AlertApiService();
import { apiClient, ApiClientError } from './apiClient';
import { API_ENDPOINTS } from '@/config/environment';

export interface DashboardStats {
  activeUsers: number;
  productsManaged: number;
  pendingApprovals: number;
  lowStockItems: number;
  usersTrend: string;
  productsTrend: string;
  approvalsTrend: string;
  stockTrend: string;
}

export interface PendingApproval {
  id: string;
  type: string;
  product: string;
  quantity: number;
  requestedBy: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface RecentActivity {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  time: string;
  createdAt: string;
}

export interface InventoryHealth {
  stockAccuracy: number;
  avgTurnover: number;
  lowStockCount: number;
  activeSKUs: number;
  skusTrend: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get<DashboardStats>(`${API_ENDPOINTS.ANALYTICS}/dashboard/stats`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch dashboard stats');
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Fallback: try overview endpoint if dashboard routes are unavailable
    if (error instanceof ApiClientError && error.status === 404) {
      try {
        const fallback = await apiClient.get<any>(`${API_ENDPOINTS.ANALYTICS}/overview`);
        if (fallback.success && fallback.data) {
          const productsTotal = fallback.data.products?.total ?? 0;
          const lowStock = fallback.data.products?.lowStock ?? 0;
          const usersTotal = fallback.data.users?.total ?? 0;
          return {
            activeUsers: usersTotal,
            productsManaged: productsTotal,
            pendingApprovals: 0,
            lowStockItems: lowStock,
            usersTrend: '0',
            productsTrend: '0',
            approvalsTrend: '0',
            stockTrend: '0',
          };
        }
      } catch (fallbackErr) {
        console.error('Fallback (overview) failed:', fallbackErr);
      }
    }
    // Default zeros if all fails
    return {
      activeUsers: 0,
      productsManaged: 0,
      pendingApprovals: 0,
      lowStockItems: 0,
      usersTrend: '0',
      productsTrend: '0',
      approvalsTrend: '0',
      stockTrend: '0'
    };
  }
};

export const getPendingApprovals = async (): Promise<PendingApproval[]> => {
  try {
    const response = await apiClient.get<PendingApproval[]>(`${API_ENDPOINTS.ANALYTICS}/dashboard/approvals`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch pending approvals');
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    // Return empty array if API fails
    return [];
  }
};

export const getRecentActivities = async (): Promise<RecentActivity[]> => {
  try {
    const response = await apiClient.get<RecentActivity[]>(`${API_ENDPOINTS.ANALYTICS}/dashboard/activities`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch recent activities');
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    // Fallback: derive from recent stock movements if dashboard route unavailable
    try {
      const fallback = await apiClient.get<any>(`${API_ENDPOINTS.STOCK}/movements?limit=5`);
      if (fallback.success && fallback.data) {
        return fallback.data.map((m: any) => ({
          id: m._id,
          message: `${m.type === 'in' ? 'Stock received' : m.type === 'out' ? 'Stock issued' : 'Stock updated'} for ${m.product?.name || 'Unknown Product'}`,
          type: m.type === 'out' ? 'warning' : 'success',
          time: m.createdAt,
          createdAt: m.createdAt,
        }));
      }
    } catch (fallbackErr) {
      console.error('Fallback (stock movements) failed:', fallbackErr);
    }
    return [];
  }
};

export const getInventoryHealth = async (): Promise<InventoryHealth> => {
  try {
    const response = await apiClient.get<InventoryHealth>(`${API_ENDPOINTS.ANALYTICS}/dashboard/inventory-health`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch inventory health');
  } catch (error) {
    console.error('Error fetching inventory health:', error);
    // Fallback: derive from overview if dashboard route unavailable
    try {
      const fallback = await apiClient.get<any>(`${API_ENDPOINTS.ANALYTICS}/overview`);
      if (fallback.success && fallback.data) {
        const total = fallback.data.products?.total ?? 0;
        const lowStock = fallback.data.products?.lowStock ?? 0;
        const activeSkus = fallback.data.products?.active ?? 0;
        const stockAccuracy = total > 0 ? Math.round(((total - lowStock) / total) * 1000) / 10 : 100;
        return {
          stockAccuracy,
          avgTurnover: 0,
          lowStockCount: lowStock,
          activeSKUs: activeSkus,
          skusTrend: activeSkus > 0 ? `${activeSkus} active` : 'No data available',
        };
      }
    } catch (fallbackErr) {
      console.error('Fallback (overview) failed:', fallbackErr);
    }
    return {
      stockAccuracy: 0,
      avgTurnover: 0,
      lowStockCount: 0,
      activeSKUs: 0,
      skusTrend: 'No data available'
    };
  }
};

export const approveRequest = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.post(`${API_ENDPOINTS.ANALYTICS}/dashboard/approvals/${id}/approve`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to approve request');
    }
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
};

export const rejectRequest = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.post(`${API_ENDPOINTS.ANALYTICS}/dashboard/approvals/${id}/reject`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to reject request');
    }
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
};

export default {
  getDashboardStats,
  getPendingApprovals,
  getRecentActivities,
  getInventoryHealth,
  approveRequest,
  rejectRequest
};
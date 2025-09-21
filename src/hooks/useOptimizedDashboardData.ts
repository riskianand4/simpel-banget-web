import { useState, useEffect, useCallback, useMemo } from 'react';
import { globalRequestThrottler } from '@/utils/requestThrottler';
import { apiClient } from '@/services/apiClient';
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

interface DashboardDataState {
  stats: DashboardStats | null;
  pendingApprovals: PendingApproval[];
  recentActivities: RecentActivity[];
  inventoryHealth: InventoryHealth | null;
  loading: boolean;
  error: string | null;
  lastFetch: number;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
const MIN_FETCH_INTERVAL = 30 * 1000; // 30 seconds minimum between fetches

export const useOptimizedDashboardData = () => {
  const [state, setState] = useState<DashboardDataState>({
    stats: null,
    pendingApprovals: [],
    recentActivities: [],
    inventoryHealth: null,
    loading: false,
    error: null,
    lastFetch: 0,
  });

  // Optimized data fetching with caching and throttling
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Check rate limiting
    if (!forceRefresh) {
      if (now - state.lastFetch < MIN_FETCH_INTERVAL) {
        return; // Too soon to fetch again
      }

      if (!globalRequestThrottler.canMakeRequest('dashboard-data')) {
        return; // Throttled
      }
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setState(prev => ({
          ...prev,
          ...cached.data,
          loading: false,
          lastFetch: cached.timestamp,
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    globalRequestThrottler.recordRequest('dashboard-data');

    try {
      // Fetch essential stats first with timeout
      const statsPromise = Promise.race([
        fetchDashboardStats(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stats timeout')), 5000)
        )
      ]);

      const stats = await statsPromise as DashboardStats;
      
      // Update state immediately with stats
      setState(prev => ({
        ...prev,
        stats,
        loading: false,
        lastFetch: now,
      }));

      // Fetch secondary data in parallel with graceful degradation
      const [approvals, activities, health] = await Promise.allSettled([
        fetchPendingApprovals(),
        fetchRecentActivities(),
        fetchInventoryHealth()
      ]);

      const finalData = {
        stats,
        pendingApprovals: approvals.status === 'fulfilled' ? approvals.value : [],
        recentActivities: activities.status === 'fulfilled' ? activities.value : [],
        inventoryHealth: health.status === 'fulfilled' ? health.value : getDefaultInventoryHealth(),
      };

      setState(prev => ({
        ...prev,
        ...finalData,
        lastFetch: now,
      }));

      // Cache successful results
      setCachedData(finalData, now);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      // Try to use cached data on error
      const cached = getCachedData();
      if (cached) {
        setState(prev => ({
          ...prev,
          ...cached.data,
          error: 'Using cached data due to network error',
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
          loading: false,
        }));
      }
    }
  }, [state.lastFetch]);

  // Individual fetch functions with fallbacks
  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<DashboardStats>(`${API_ENDPOINTS.ANALYTICS}/dashboard/stats`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch stats');
    } catch (error) {
      // Fallback to overview endpoint
      try {
        const fallback = await apiClient.get<any>(`${API_ENDPOINTS.ANALYTICS}/overview`);
        if (fallback.success && fallback.data) {
          return {
            activeUsers: fallback.data.users?.total ?? 0,
            productsManaged: fallback.data.products?.total ?? 0,
            pendingApprovals: 0,
            lowStockItems: fallback.data.products?.lowStock ?? 0,
            usersTrend: '0',
            productsTrend: '0',
            approvalsTrend: '0',
            stockTrend: '0',
          };
        }
      } catch (fallbackError) {
        console.error('Stats fallback failed:', fallbackError);
      }
      
      return getDefaultStats();
    }
  };

  const fetchPendingApprovals = async (): Promise<PendingApproval[]> => {
    try {
      const response = await apiClient.get<PendingApproval[]>(`${API_ENDPOINTS.ANALYTICS}/dashboard/approvals`);
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Approvals fetch failed:', error);
      return [];
    }
  };

  const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
    try {
      const response = await apiClient.get<RecentActivity[]>(`${API_ENDPOINTS.ANALYTICS}/dashboard/activities`);
      return response.success && response.data ? response.data : [];
    } catch (error) {
      // Fallback to stock movements
      try {
        const fallback = await apiClient.get<any>(`${API_ENDPOINTS.STOCK}/movements?limit=5`);
        if (fallback.success && fallback.data) {
          return fallback.data.map((m: any) => ({
            id: m._id || `activity-${Date.now()}-${Math.random()}`,
            message: `${m.type === 'in' ? 'Stock received' : m.type === 'out' ? 'Stock issued' : 'Stock updated'} for ${m.product?.name || 'Product'}`,
            type: m.type === 'out' ? 'warning' : 'success',
            time: m.createdAt || new Date().toISOString(),
            createdAt: m.createdAt || new Date().toISOString(),
          }));
        }
      } catch (fallbackError) {
        console.error('Activities fallback failed:', fallbackError);
      }
      return [];
    }
  };

  const fetchInventoryHealth = async (): Promise<InventoryHealth> => {
    try {
      const response = await apiClient.get<InventoryHealth>(`${API_ENDPOINTS.ANALYTICS}/dashboard/inventory-health`);
      return response.success && response.data ? response.data : getDefaultInventoryHealth();
    } catch (error) {
      // Fallback to overview
      try {
        const fallback = await apiClient.get<any>(`${API_ENDPOINTS.ANALYTICS}/overview`);
        if (fallback.success && fallback.data) {
          const total = fallback.data.products?.total ?? 0;
          const lowStock = fallback.data.products?.lowStock ?? 0;
          const activeSkus = fallback.data.products?.active ?? total;
          const stockAccuracy = total > 0 ? Math.round(((total - lowStock) / total) * 1000) / 10 : 100;
          
          return {
            stockAccuracy,
            avgTurnover: 0,
            lowStockCount: lowStock,
            activeSKUs: activeSkus,
            skusTrend: activeSkus > 0 ? `${activeSkus} active` : 'No data available',
          };
        }
      } catch (fallbackError) {
        console.error('Health fallback failed:', fallbackError);
      }
      return getDefaultInventoryHealth();
    }
  };

  // Default data factories
  const getDefaultStats = (): DashboardStats => ({
    activeUsers: 0,
    productsManaged: 0,
    pendingApprovals: 0,
    lowStockItems: 0,
    usersTrend: '0',
    productsTrend: '0',
    approvalsTrend: '0',
    stockTrend: '0'
  });

  const getDefaultInventoryHealth = (): InventoryHealth => ({
    stockAccuracy: 0,
    avgTurnover: 0,
    lowStockCount: 0,
    activeSKUs: 0,
    skusTrend: 'No data available'
  });

  // Cache management
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem('optimized-dashboard-cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      localStorage.removeItem('optimized-dashboard-cache');
      return null;
    }
  };

  const setCachedData = (data: any, timestamp: number) => {
    try {
      localStorage.setItem('optimized-dashboard-cache', JSON.stringify({ data, timestamp }));
    } catch (error) {
      console.error('Cache save failed:', error);
    }
  };

  // Approval actions with optimistic updates
  const handleApprove = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals.filter(approval => approval.id !== id)
      }));

      await apiClient.post(`${API_ENDPOINTS.ANALYTICS}/dashboard/approvals/${id}/approve`);
      
      // Refresh stats after approval
      const updatedStats = await fetchDashboardStats();
      setState(prev => ({ ...prev, stats: updatedStats }));
    } catch (error) {
      // Revert optimistic update on error
      fetchDashboardData();
      throw error;
    }
  }, [fetchDashboardData]);

  const handleReject = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals.filter(approval => approval.id !== id)
      }));

      await apiClient.post(`${API_ENDPOINTS.ANALYTICS}/dashboard/approvals/${id}/reject`);
      
      // Refresh stats after rejection
      const updatedStats = await fetchDashboardStats();
      setState(prev => ({ ...prev, stats: updatedStats }));
    } catch (error) {
      // Revert optimistic update on error
      fetchDashboardData();
      throw error;
    }
  }, [fetchDashboardData]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized computed values
  const computedValues = useMemo(() => ({
    hasData: !!state.stats,
    isStale: state.lastFetch > 0 && (Date.now() - state.lastFetch) > CACHE_DURATION,
    canRefresh: (Date.now() - state.lastFetch) >= MIN_FETCH_INTERVAL,
  }), [state.stats, state.lastFetch]);

  return {
    ...state,
    ...computedValues,
    refreshData: useCallback(() => fetchDashboardData(true), [fetchDashboardData]),
    handleApprove,
    handleReject,
  };
};
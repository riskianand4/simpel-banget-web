import { useState, useEffect, useCallback, useRef } from 'react';
import { psbApi } from '@/services/psbApi';
import { PSBAnalytics } from '@/types/psb';
import { toast } from 'sonner';

// Global analytics cache to prevent duplicate requests
class AnalyticsManager {
  private static instance: AnalyticsManager;
  private analytics: PSBAnalytics | null = null;
  private loading = false;
  private error: string | null = null;
  private lastFetch = 0;
  private cacheDuration = 500000; // 5 menit
  private subscribers = new Set<() => void>();
  private activeRequest: Promise<any> | null = null;

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  async fetchAnalytics(force = false): Promise<{ success: boolean; data: PSBAnalytics | null }> {
    const now = Date.now();
    
    // Return cached data if recent and not forced
    if (!force && this.analytics && (now - this.lastFetch) < this.cacheDuration) {
      return { success: true, data: this.analytics };
    }

    // If there's already an active request, wait for it
    if (this.activeRequest) {
      return this.activeRequest;
    }

    this.loading = true;
    this.error = null;
    this.notifySubscribers();

    this.activeRequest = this.performFetch();
    const result = await this.activeRequest;
    this.activeRequest = null;

    return result;
  }

  private async performFetch(): Promise<{ success: boolean; data: PSBAnalytics | null }> {
    try {
      const response = await psbApi.getAnalytics();
      
      // Handle both wrapped and direct responses
      let analyticsData = null;
      let success = false;
      
      if (response && typeof response === 'object') {
        if (response.success !== undefined) {
          // Wrapped response format: { success: boolean, data: object }
          success = response.success;
          analyticsData = response.data;
        } else if ((response as any).summary || (response as any).clusterStats || (response as any).stoStats) {
          // Direct analytics object response
          success = true;
          analyticsData = response as any as PSBAnalytics;
        } else {
          // Unknown format, treat as successful if data exists
          success = true;
          analyticsData = (response as any).data || response;
        }
      }
      
      if (success && analyticsData) {
        this.analytics = analyticsData;
        this.lastFetch = Date.now();
        this.error = null;
        this.loading = false;
        this.notifySubscribers();
        return { success: true, data: this.analytics };
      }
      
      // Handle case where analytics is empty but valid
      const hasValidData = analyticsData && (
        (analyticsData.summary && analyticsData.summary.totalOrders >= 0) ||
        (analyticsData.clusterStats && Array.isArray(analyticsData.clusterStats)) ||
        (analyticsData.stoStats && Array.isArray(analyticsData.stoStats))
      );
      
      if (hasValidData) {
        this.analytics = analyticsData;
        this.lastFetch = Date.now();
        this.error = null;
        this.loading = false;
        this.notifySubscribers();
        return { success: true, data: this.analytics };
      }
      
    } catch (error: any) {
      console.error('Error fetching PSB analytics:', error);
      
      // Distinguish between network errors and empty data
      const isNetworkError = error.status >= 500 || error.message?.includes('network') || error.message?.includes('fetch');
      const isEmpty = error.status === 200 && (!this.analytics || this.analytics.summary.totalOrders === 0);
      
      if (isNetworkError) {
        this.error = 'Backend PSB service tidak dapat dijangkau';
        toast.error('Backend PSB service bermasalah');
      } else if (isEmpty) {
        this.error = 'no_data';
      } else {
        this.error = error.message || 'Failed to fetch analytics';
      }
      
      // Only show network error toasts, not for empty data or rate limits
      if (isNetworkError && error.status !== 429 && !error.message?.includes('Rate limit')) {
        // Already shown above
      }
      
      // Set fallback data for empty state
      this.analytics = {
        summary: {
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          inProgressOrders: 0,
          completionRate: '0'
        },
        clusterStats: [],
        stoStats: [],
        monthlyTrends: []
      };
    } finally {
      this.loading = false;
      this.notifySubscribers();
    }
    
    return { success: false, data: this.analytics };
  }

  getState() {
    return {
      analytics: this.analytics,
      loading: this.loading,
      error: this.error
    };
  }

  clearCache() {
    this.analytics = null;
    this.lastFetch = 0;
    this.error = null;
    this.notifySubscribers();
  }
}

export const usePSBAnalytics = () => {
  const manager = AnalyticsManager.getInstance();
  const [state, setState] = useState(manager.getState());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      if (mountedRef.current) {
        setState(manager.getState());
      }
    });

    return unsubscribe;
  }, []);

  const fetchAnalytics = useCallback(async (force = false) => {
    if (!mountedRef.current) return;
    return manager.fetchAnalytics(force);
  }, [manager]);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalytics(true);
  }, [fetchAnalytics]);

  const clearCache = useCallback(() => {
    manager.clearCache();
  }, [manager]);

  // Auto-fetch on mount if no data
  useEffect(() => {
    if (!state.analytics && !state.loading) {
      fetchAnalytics();
    }
  }, []);

  return {
    analytics: state.analytics,
    loading: state.loading,
    error: state.error,
    fetchAnalytics,
    refreshAnalytics,
    clearCache,
  };
};
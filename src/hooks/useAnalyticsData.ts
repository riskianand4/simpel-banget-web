import { useHybridData } from '@/hooks/useHybridData';
import analyticsApi from '@/services/analyticsApi';
import type { AnalyticsOverview, TrendData, CategoryData, VelocityData, SmartInsight, StockAlert } from '@/types/analytics';

// Hook for analytics overview/KPI data - uses real backend data
export function useAnalyticsOverview(timeFilter: string = 'month'): ReturnType<typeof useHybridData<AnalyticsOverview>> {
  return useHybridData<AnalyticsOverview>({
    localData: null, // No fallback mock data
    localFunction: () => null,
    apiFunction: async () => {
      const data = await analyticsApi.getAnalyticsOverview();
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for trend analysis data - uses real backend data
export function useAnalyticsTrends(timeFilter: string = 'month'): ReturnType<typeof useHybridData<TrendData[]>> {
  return useHybridData<TrendData[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const data = await analyticsApi.getTrendAnalysis({ timeFilter });
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for category analysis data - uses real backend data
export function useCategoryAnalysis(): ReturnType<typeof useHybridData<CategoryData[]>> {
  return useHybridData<CategoryData[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const data = await analyticsApi.getCategoryAnalysis();
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for stock velocity data - uses real backend data
export function useStockVelocity(timeFilter: string = 'month'): ReturnType<typeof useHybridData<VelocityData[]>> {
  return useHybridData<VelocityData[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const period = timeFilter === 'week' ? '7d' : timeFilter === 'month' ? '30d' : '90d';
      const data = await analyticsApi.getStockVelocity({ period });
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for stock alerts data - uses real backend data
export function useStockAlerts(): ReturnType<typeof useHybridData<StockAlert[]>> {
  return useHybridData<StockAlert[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const data = await analyticsApi.getStockAlerts();
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for smart insights data - uses real backend data
export function useSmartInsights(timeFilter: string = 'month'): ReturnType<typeof useHybridData<SmartInsight[]>> {
  return useHybridData<SmartInsight[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const data = await analyticsApi.getSmartInsights({ timeFilter });
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for stock movement flow data
export function useStockMovementFlow(timeFilter: string = 'month', dateRange?: any): ReturnType<typeof useHybridData<any[]>> {
  return useHybridData<any[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const data = await analyticsApi.getStockMovementFlow({ timeFilter, dateRange });
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for stock health gauge data
export function useStockHealthGauge(): ReturnType<typeof useHybridData<any>> {
  return useHybridData<any>({
    localData: null,
    localFunction: () => null,
    apiFunction: async () => {
      const data = await analyticsApi.getStockHealthGauge();
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}

// Hook for supplier performance data
export function useSupplierPerformance(): ReturnType<typeof useHybridData<any[]>> {
  return useHybridData<any[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const data = await analyticsApi.getSupplierPerformance();
      return {
        success: true,
        data
      };
    },
    autoRefresh: true,
  });
}
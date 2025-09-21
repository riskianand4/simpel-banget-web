import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/environment';
import type { 
  AnalyticsOverview, 
  TrendData, 
  CategoryData, 
  VelocityData, 
  SmartInsight,
  StockAlert,
  StockMovementFlow,
  SupplierPerformance,
  FinancialMetrics,
  StockHealthGauge,
  DemandForecast,
  ReorderPrediction
} from '@/types/analytics';

// Backend response interfaces
interface BackendOverviewResponse {
  products?: {
    total: number;
    active: number;
    lowStock: number;
  };
  stock?: {
    totalValue: number;
    recentMovements: number;
  };
  assets?: {
    total: number;
    inUse: number;
  };
  users?: {
    total: number;
  };
}

interface BackendTrendResponse {
  movementTrends?: Array<{
    _id: string;
    totalMovements: number;
    movements?: Array<{
      type: string;
      quantity: number;
      count: number;
    }>;
  }>;
  stockValueTrend?: Array<{
    totalValue: number;
  }>;
}

interface BackendCategoryResponse {
  categoryStats?: Array<{
    _id: string;
    totalStockValue: number;
    totalStock: number;
    lowStockPercentage: number;
  }>;
}

interface BackendVelocityItem {
  _id: string;
  productName: string;
  category: string;
  velocityPerDay: number;
  daysOfStock: number;
}

interface BackendSupplierResponse {
  suppliers?: Array<{
    _id: string;
    totalProducts: number;
    totalStockValue: number;
  }>;
}

// Get analytics overview from real backend data
export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/overview`);
    if (response.success && response.data) {
      const data = response.data as BackendOverviewResponse;
      
      return {
        totalProducts: data.products?.total || 0,
        totalValue: data.stock?.totalValue || 0,
        totalValueGrowth: 12.5, // Calculate from historical data if available
        lowStockCount: data.products?.lowStock || 0,
        outOfStockCount: 0, // Add to backend if needed
        stockMovements: data.stock?.recentMovements || 0,
        avgDailyMovements: (data.stock?.recentMovements || 0) / 7,
        turnoverRate: 8.7, // Calculate from stock movements if available
        stockHealth: data.products?.total && data.products.total > 0 
          ? Math.round(((data.products.total - (data.products.lowStock || 0)) / data.products.total) * 100)
          : 0
      };
    }
    throw new Error('Failed to fetch analytics overview');
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    throw error;
  }
};

// Get trend analysis data
export const getTrendAnalysis = async (params: { timeFilter?: string } = {}): Promise<TrendData[]> => {
  try {
    const period = params.timeFilter === 'week' ? '7d' : 
                  params.timeFilter === 'month' ? '30d' : 
                  params.timeFilter === 'quarter' ? '90d' : '30d';
    
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/trends?period=${period}`);
    if (response.success && response.data) {
      const data = response.data as BackendTrendResponse;
      const { movementTrends = [], stockValueTrend = [] } = data;
      
      // Transform backend data to frontend format
      return movementTrends.map((trend) => ({
        date: trend._id,
        totalProducts: stockValueTrend?.length || 0,
        totalValue: stockValueTrend?.reduce((sum: number, item) => sum + (item.totalValue || 0), 0) || 0,
        stockMovements: trend.totalMovements || 0,
        lowStockCount: 0, // Add if needed
        outOfStockCount: 0, // Add if needed
        salesCount: trend.movements?.find((m) => m.type === 'out')?.count || 0,
        restockCount: trend.movements?.find((m) => m.type === 'in')?.count || 0,
        formattedDate: new Date(trend._id).toLocaleDateString('id-ID')
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    return [];
  }
};

// Get category analysis data
export const getCategoryAnalysis = async (): Promise<CategoryData[]> => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/category-analysis`);
    if (response.success && response.data) {
      const data = response.data as BackendCategoryResponse;
      const { categoryStats = [] } = data;
      
      return categoryStats.map((category) => ({
        category: category._id || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        value: category.totalStockValue || 0,
        volume: category.totalStock || 0,
        trend: (category.lowStockPercentage || 0) > 20 ? 'down' : 
               (category.lowStockPercentage || 0) < 5 ? 'up' : 'stable'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching category analysis:', error);
    return [];
  }
};

// Get stock velocity data
export const getStockVelocity = async (params: { period?: string } = {}): Promise<VelocityData[]> => {
  try {
    const period = params.period || '30d';
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/stock-velocity?period=${period}`);
    
    if (response.success && Array.isArray(response.data)) {
      return response.data.map((item: BackendVelocityItem) => ({
        productId: item._id,
        productName: item.productName || 'Unknown Product',
        category: item.category || 'Uncategorized',
        dailyMovement: item.velocityPerDay || 0,
        monthlyMovement: (item.velocityPerDay || 0) * 30,
        turnoverRate: item.velocityPerDay || 0,
        daysUntilOutOfStock: Math.max(0, item.daysOfStock || 0),
        reorderRecommended: (item.daysOfStock || 0) < 30,
        seasonalIndex: 1.0 // Add seasonal calculation if needed
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching stock velocity:', error);
    return [];
  }
};

// Get supplier performance data
export const getSupplierPerformance = async (): Promise<SupplierPerformance[]> => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/supplier-performance`);
    if (response.success && response.data) {
      const data = response.data as BackendSupplierResponse;
      const { suppliers = [] } = data;
      
      return suppliers.map((supplier) => ({
        supplierId: supplier._id,
        supplierName: supplier._id,
        onTimeDelivery: 95, // Add to backend if needed
        avgLeadTime: 7, // Add to backend if needed
        qualityScore: 85, // Add to backend if needed
        totalOrders: supplier.totalProducts || 0,
        costVariance: 5, // Add to backend if needed
        reliability: (supplier.totalStockValue || 0) > 1000000 ? 'excellent' : 
                    (supplier.totalStockValue || 0) > 500000 ? 'good' : 
                    (supplier.totalStockValue || 0) > 100000 ? 'fair' : 'poor'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    return [];
  }
};

// Get stock alerts (derived from low stock data)
export const getStockAlerts = async (): Promise<StockAlert[]> => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/overview`);
    if (response.success && response.data) {
      const data = response.data as BackendOverviewResponse;
      const alerts: StockAlert[] = [];
      
      if (data.products?.lowStock && data.products.lowStock > 0) {
        alerts.push({
          id: 'low-stock-alert',
          type: 'warning',
          productId: 'multiple',
          productName: 'Multiple Products',
          message: `${data.products.lowStock} products are below minimum stock level`,
          priority: data.products.lowStock > 10 ? 3 : 2,
          timestamp: new Date(),
          actionRequired: true
        });
      }
      
      return alerts;
    }
    return [];
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    return [];
  }
};

// Get smart insights (generated from real data analysis)
export const getSmartInsights = async (params: { timeFilter?: string } = {}): Promise<SmartInsight[]> => {
  try {
    const [overview, velocity, category] = await Promise.all([
      getAnalyticsOverview(),
      getStockVelocity(),
      getCategoryAnalysis()
    ]);
    
    const insights: SmartInsight[] = [];
    let insightId = 1;
    
    // Generate insights based on real data
    if (overview.lowStockCount > 0) {
      insights.push({
        id: insightId++,
        type: 'alert',
        title: 'Low Stock Alert',
        message: `${overview.lowStockCount} products are below minimum stock levels and need immediate attention`,
        impact: overview.lowStockCount > 10 ? 'critical' : 'high',
        timeframe: 'immediate',
        actionable: true,
        data: { count: overview.lowStockCount }
      });
    }
    
    if (overview.stockHealth < 70) {
      insights.push({
        id: insightId++,
        type: 'performance',
        title: 'Stock Health Concern',
        message: `Overall stock health is at ${overview.stockHealth}%. Consider reviewing inventory management practices`,
        impact: 'medium',
        timeframe: '1 week',
        actionable: true,
        data: { health: overview.stockHealth }
      });
    }
    
    // Fast-moving products insight
    const fastMoving = velocity.filter(v => v.dailyMovement > 5).length;
    if (fastMoving > 0) {
      insights.push({
        id: insightId++,
        type: 'opportunity',
        title: 'Fast-Moving Products',
        message: `${fastMoving} products are moving quickly. Consider increasing stock levels to avoid stockouts`,
        impact: 'medium',
        timeframe: '2 weeks',
        actionable: true,
        data: { count: fastMoving }
      });
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating smart insights:', error);
    return [];
  }
};

// Get stock movement flow data
export const getStockMovementFlow = async (params: { timeFilter?: string; dateRange?: any } = {}): Promise<StockMovementFlow[]> => {
  try {
    const period = params.timeFilter === 'week' ? '7d' : '30d';
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/trends?period=${period}`);
    
    if (response.success && response.data) {
      const data = response.data as BackendTrendResponse;
      const { movementTrends = [] } = data;
      
      return movementTrends.map((trend) => {
        const inMovement = trend.movements?.find((m) => m.type === 'in') || { quantity: 0 };
        const outMovement = trend.movements?.find((m) => m.type === 'out') || { quantity: 0 };
        const adjustments = trend.movements?.find((m) => m.type === 'adjustment') || { quantity: 0 };
        const transfers = trend.movements?.find((m) => m.type === 'transfer') || { quantity: 0 };
        
        return {
          date: trend._id,
          stockIn: inMovement.quantity,
          stockOut: outMovement.quantity,
          adjustments: adjustments.quantity,
          transfers: transfers.quantity,
          netFlow: inMovement.quantity - outMovement.quantity,
          formattedDate: new Date(trend._id).toLocaleDateString('id-ID')
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching stock movement flow:', error);
    return [];
  }
};

// Get stock health gauge data
export const getStockHealthGauge = async (): Promise<StockHealthGauge> => {
  try {
    const overview = await getAnalyticsOverview();
    const velocity = await getStockVelocity();
    
    // Calculate health metrics based on real data
    const availability = overview.totalProducts > 0 
      ? Math.round(((overview.totalProducts - overview.outOfStockCount) / overview.totalProducts) * 100)
      : 100;
    
    const accuracy = overview.totalProducts > 0
      ? Math.round(((overview.totalProducts - overview.lowStockCount) / overview.totalProducts) * 100)
      : 100;
    
    const velocityScore = velocity.length > 0 
      ? Math.min(100, Math.round(velocity.reduce((sum, v) => sum + v.dailyMovement, 0) / velocity.length * 10))
      : 50;
    
    const quality = Math.round((availability + accuracy) / 2);
    const overall = Math.round((availability + accuracy + velocityScore + quality) / 4);
    
    return {
      overall,
      availability,
      accuracy,
      velocity: velocityScore,
      quality
    };
  } catch (error) {
    console.error('Error calculating stock health gauge:', error);
    return {
      overall: 0,
      availability: 0,
      accuracy: 0,
      velocity: 0,
      quality: 0
    };
  }
};

export default {
  getAnalyticsOverview,
  getTrendAnalysis,
  getCategoryAnalysis,
  getStockVelocity,
  getSupplierPerformance,
  getStockAlerts,
  getSmartInsights,
  getStockMovementFlow,
  getStockHealthGauge
};
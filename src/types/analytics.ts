export interface AnalyticsOverview {
  totalProducts: number;
  totalValue: number;
  totalValueGrowth?: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockMovements: number;
  avgDailyMovements: number;
  turnoverRate: number;
  stockHealth: number;
}

export interface TrendData {
  date: string;
  totalProducts: number;
  totalValue: number;
  stockMovements: number;
  lowStockCount: number;
  outOfStockCount: number;
  salesCount: number;
  restockCount: number;
  formattedDate?: string;
}

export interface CategoryData {
  category: string;
  date: string;
  value: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
}

export interface VelocityData {
  productId: string;
  productName: string;
  category: string;
  dailyMovement: number;
  monthlyMovement: number;
  turnoverRate: number;
  daysUntilOutOfStock: number;
  reorderRecommended: boolean;
  seasonalIndex: number;
}

export interface SmartInsight {
  id: number;
  type: 'opportunity' | 'alert' | 'insight' | 'performance' | 'recommendation' | 'trend';
  title: string;
  message: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
  actionable: boolean;
  data?: any;
}

export interface StockAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  productId: string;
  productName: string;
  message: string;
  priority: number;
  timestamp: Date;
  actionRequired: boolean;
}

// New Analytics Types for Enhanced Visualizations

export interface StockMovementFlow {
  date: string;
  stockIn: number;
  stockOut: number;
  adjustments: number;
  transfers: number;
  netFlow: number;
  formattedDate?: string;
}

export interface StockMovementBreakdown {
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  count: number;
  value: number;
  percentage: number;
  color: string;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  onTimeDelivery: number;
  avgLeadTime: number;
  qualityScore: number;
  totalOrders: number;
  costVariance: number;
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface FinancialMetrics {
  inventoryValue: number;
  costOfGoodsSold: number;
  carryingCosts: number;
  stockoutCosts: number;
  roi: number;
  turnoverValue: number;
  cashFlow: number;
}

export interface OperationalMetrics {
  warehouseEfficiency: number;
  processingTime: number;
  errorRate: number;
  resourceUtilization: number;
  accuracyRate: number;
  throughput: number;
}

export interface StockHealthGauge {
  overall: number;
  availability: number;
  accuracy: number;
  velocity: number;
  quality: number;
}

export interface DemandForecast {
  date: string;
  predicted: number;
  actual?: number;
  confidenceHigh: number;
  confidenceLow: number;
  seasonalFactor: number;
  trendFactor: number;
}

export interface ReorderPrediction {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  daysToStockout: number;
  recommendedOrder: number;
  confidence: number;
  priority: 'urgent' | 'soon' | 'monitor';
}
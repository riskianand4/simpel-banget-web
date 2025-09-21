import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DashboardStats } from '@/services/dashboardApi';

interface OptimizedStatsOverviewProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

// Memoized component to prevent unnecessary re-renders
export const OptimizedStatsOverview = memo<OptimizedStatsOverviewProps>(({
  stats,
  isLoading = false,
}) => {
  const getTrendIcon = (trend: string) => {
    const value = parseFloat(trend);
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend: string) => {
    const value = parseFloat(trend);
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Show placeholder while loading */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-3 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Active Users',
      value: stats.activeUsers,
      trend: stats.usersTrend,
      description: 'Total active users',
    },
    {
      title: 'Products Managed',
      value: stats.productsManaged,
      trend: stats.productsTrend,
      description: 'Total products in inventory',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      trend: stats.approvalsTrend,
      description: 'Awaiting approval',
      urgent: stats.pendingApprovals > 0,
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      trend: stats.stockTrend,
      description: 'Items below threshold',
      urgent: stats.lowStockItems > 5,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.title} className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {item.title}
              {item.urgent && (
                <Badge variant="destructive" className="text-xs">
                  Alert
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(item.trend)}
              <span className={`text-xs ${getTrendColor(item.trend)}`}>
                {item.trend}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                vs last month
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

OptimizedStatsOverview.displayName = 'OptimizedStatsOverview';

export default OptimizedStatsOverview;
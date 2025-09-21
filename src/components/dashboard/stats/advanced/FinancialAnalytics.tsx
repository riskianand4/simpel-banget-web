import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { TimeFilter, DateRange } from '../../AdvancedStatsOverview';
import { useAnalyticsOverview, useAnalyticsTrends } from '@/hooks/useAnalyticsData';

interface FinancialAnalyticsProps {
  timeFilter: TimeFilter;
  dateRange: DateRange;
}

const FinancialAnalytics = ({ timeFilter, dateRange }: FinancialAnalyticsProps) => {
  const { data: overview, isLoading: overviewLoading, isFromApi } = useAnalyticsOverview();
  const { data: trends, isLoading: trendsLoading } = useAnalyticsTrends(timeFilter);
  
  const isLoading = overviewLoading || trendsLoading;

  const financialData = useMemo(() => {
    // Use real data where available, with calculated estimates
    if (!trends || !Array.isArray(trends)) {
      return [{
        date: new Date().toISOString().split('T')[0],
        formattedDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        inventoryValue: overview?.totalValue || 0,
        cogs: (overview?.totalValue || 0) * 0.7, // Estimated COGS
        carryingCosts: (overview?.totalValue || 0) * 0.15, // Estimated carrying costs
        stockoutCosts: 0,
        roi: 12.5, // Estimated ROI
        turnoverValue: (overview?.totalValue || 0) * 2.5,
        cashFlow: (overview?.totalValue || 0) * 0.15
      }];
    }

    return trends.map((trend, index) => {
      const baseValue = trend.totalValue || overview?.totalValue || 50000000;
      const inventoryValue = baseValue;
      const cogs = inventoryValue * 0.7; // Standard estimate
      const carryingCosts = inventoryValue * 0.15;
      
      return {
        date: trend.date,
        formattedDate: trend.formattedDate || new Date(trend.date).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'short' 
        }),
        inventoryValue,
        cogs,
        carryingCosts,
        stockoutCosts: 0, // Add from backend if available
        roi: inventoryValue > 0 ? ((inventoryValue - cogs - carryingCosts) / inventoryValue) * 100 : 0,
        turnoverValue: inventoryValue * 2.5,
        cashFlow: inventoryValue - cogs - carryingCosts
      };
    });
  }, [trends, overview, timeFilter]);

  const costBreakdown = useMemo(() => {
    const currentValue = overview?.totalValue || 50000000;
    const cogs = currentValue * 0.7;
    const carryingCosts = currentValue * 0.15;
    const storageCosts = currentValue * 0.08;
    const insuranceCosts = currentValue * 0.03;
    const stockoutCosts = currentValue * 0.02;
    
    return [
      { name: 'Cost of Goods Sold', value: cogs, color: 'hsl(var(--primary))' },
      { name: 'Carrying Costs', value: carryingCosts, color: 'hsl(var(--warning))' },
      { name: 'Storage Costs', value: storageCosts, color: 'hsl(var(--accent))' },
      { name: 'Insurance & Others', value: insuranceCosts, color: 'hsl(var(--secondary))' },
      { name: 'Stockout Costs', value: stockoutCosts, color: 'hsl(var(--destructive))' }
    ];
  }, [overview]);

  const roiTrendData = useMemo(() => {
    return financialData.map(item => ({
      ...item,
      targetROI: 15,
      industryAvg: 12.5
    }));
  }, [financialData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}: {
                item.dataKey.includes('roi') || item.dataKey.includes('ROI') || item.dataKey.includes('Avg') 
                  ? `${formatNumber(item.value)}%`
                  : formatCurrency(item.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Analisis Keuangan Inventori
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Analisis Keuangan Inventori
          <Badge variant="secondary" className="text-xs bg-success/20 text-success ml-auto">
            {isFromApi ? 'Live Data' : 'Estimates'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="costs">Breakdown Biaya</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border bg-card/50 text-center">
                <DollarSign className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-xl font-bold text-success">
                  {formatCurrency(financialData[financialData.length - 1]?.inventoryValue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Inventory Value</div>
              </div>
              
              <div className="p-4 rounded-lg border bg-card/50 text-center">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-xl font-bold">
                  {formatNumber(financialData[financialData.length - 1]?.roi || 0)}%
                </div>
                <div className="text-sm text-muted-foreground">Current ROI</div>
              </div>
              
              <div className="p-4 rounded-lg border bg-card/50 text-center">
                <BarChart3 className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-xl font-bold">
                  {formatCurrency(financialData[financialData.length - 1]?.turnoverValue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Turnover Value</div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData}>
                  <defs>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value).replace('Rp', 'Rp ')}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="inventoryValue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#valueGradient)"
                    strokeWidth={2}
                    name="Inventory Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(data.value)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <div className="space-y-3">
                {costBreakdown.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(item.value)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((item.value / costBreakdown.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roi" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiTrendData}>
                  <defs>
                    <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="hsl(var(--success))" 
                    fill="url(#roiGradient)"
                    strokeWidth={2}
                    name="Actual ROI"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="targetROI" 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    fill="transparent"
                    strokeWidth={2}
                    name="Target ROI"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="industryAvg" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="3 3"
                    fill="transparent"
                    strokeWidth={1}
                    name="Industry Avg"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value).replace('Rp', 'Rp ')}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="cashFlow" 
                    fill="hsl(var(--accent))"
                    name="Net Cash Flow"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FinancialAnalytics;
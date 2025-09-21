import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Package, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { TimeFilter, DateRange } from '../../AdvancedStatsOverview';
import { useStockMovementFlow } from '@/hooks/useAnalyticsData';

interface StockMovementFlowProps {
  timeFilter: TimeFilter;
  dateRange: DateRange;
}

const StockMovementFlow = ({ timeFilter, dateRange }: StockMovementFlowProps) => {
  const { data: rawFlowData, isLoading, isFromApi } = useStockMovementFlow(timeFilter, dateRange);

  const flowData = useMemo(() => {
    if (!rawFlowData || !Array.isArray(rawFlowData)) return [];
    
    return rawFlowData.map(item => ({
      ...item,
      formattedDate: item.formattedDate || new Date(item.date).toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short' 
      })
    }));
  }, [rawFlowData]);

  const movementBreakdown = useMemo(() => {
    if (!flowData || flowData.length === 0) {
      return [
        { type: 'Stock Masuk', value: 0, percentage: 0, color: 'hsl(var(--success))' },
        { type: 'Stock Keluar', value: 0, percentage: 0, color: 'hsl(var(--warning))' },
        { type: 'Penyesuaian', value: 0, percentage: 0, color: 'hsl(var(--accent))' },
        { type: 'Transfer', value: 0, percentage: 0, color: 'hsl(var(--primary))' }
      ];
    }

    const totals = flowData.reduce((acc, item) => ({
      stockIn: acc.stockIn + (item.stockIn || 0),
      stockOut: acc.stockOut + (item.stockOut || 0),
      adjustments: acc.adjustments + Math.abs(item.adjustments || 0),
      transfers: acc.transfers + (item.transfers || 0)
    }), { stockIn: 0, stockOut: 0, adjustments: 0, transfers: 0 });

    const total = totals.stockIn + totals.stockOut + totals.adjustments + totals.transfers;
    
    return [
      { 
        type: 'Stock Masuk', 
        value: totals.stockIn, 
        percentage: total > 0 ? Math.round((totals.stockIn / total) * 100) : 0, 
        color: 'hsl(var(--success))' 
      },
      { 
        type: 'Stock Keluar', 
        value: totals.stockOut, 
        percentage: total > 0 ? Math.round((totals.stockOut / total) * 100) : 0, 
        color: 'hsl(var(--warning))' 
      },
      { 
        type: 'Penyesuaian', 
        value: totals.adjustments, 
        percentage: total > 0 ? Math.round((totals.adjustments / total) * 100) : 0, 
        color: 'hsl(var(--accent))' 
      },
      { 
        type: 'Transfer', 
        value: totals.transfers, 
        percentage: total > 0 ? Math.round((totals.transfers / total) * 100) : 0, 
        color: 'hsl(var(--primary))' 
      }
    ];
  }, [flowData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}: {formatNumber(item.value)}
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
            <div className="w-2 h-6 bg-primary rounded-full" />
            Aliran Pergerakan Stok
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
          <div className="w-2 h-6 bg-primary rounded-full" />
          Aliran Pergerakan Stok
          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary ml-auto">
            {isFromApi ? 'Live Data' : 'Cached'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="flow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flow">Aliran Stok</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="velocity">Kecepatan</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData}>
                  <defs>
                    <linearGradient id="stockInGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="stockOutGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
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
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="stockIn" 
                    stackId="1"
                    stroke="hsl(var(--success))" 
                    fill="url(#stockInGradient)"
                    strokeWidth={2}
                    name="Stok Masuk"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stockOut" 
                    stackId="2"
                    stroke="hsl(var(--warning))" 
                    fill="url(#stockOutGradient)"
                    strokeWidth={2}
                    name="Stok Keluar"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={movementBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {movementBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatNumber(data.value)} unit ({data.percentage}%)
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
                {movementBreakdown.map((item, index) => (
                  <motion.div
                    key={item.type}
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
                      <span className="font-medium text-sm">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatNumber(item.value)}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="velocity" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="netFlow" 
                    fill="hsl(var(--accent))"
                    name="Net Flow"
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

export default StockMovementFlow;
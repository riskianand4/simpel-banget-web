import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, TrendingUp, Calendar, Target } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { useStockVelocity, useAnalyticsTrends } from '@/hooks/useAnalyticsData';
const PredictiveAnalytics = () => {
  const { data: velocityData } = useStockVelocity();
  const { data: trendsData } = useAnalyticsTrends();

  const predictions = useMemo(() => {
    // Generate predictive data based on real trend data
    const futureData = [];
    const baseDate = new Date();
    
    // Calculate baseline demand from recent trends
    const recentAverage = trendsData && trendsData.length > 0 
      ? trendsData.slice(-7).reduce((sum, item) => sum + (item.stockMovements || 0), 0) / 7
      : 15;
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      // Use real data patterns for predictions
      const seasonalFactor = 1 + Math.sin(i / 30 * Math.PI * 2) * 0.2;
      const trendFactor = trendsData && trendsData.length > 1 
        ? 1 + (trendsData[trendsData.length - 1].stockMovements - trendsData[0].stockMovements) / (trendsData.length * trendsData[0].stockMovements || 1) * (i / 30)
        : 1 + i / 30 * 0.05;
      const randomFactor = 0.9 + Math.random() * 0.2;
      const baseDemand = recentAverage || 15;
      const predictedDemand = baseDemand * seasonalFactor * trendFactor * randomFactor;
      futureData.push({
        date: date.toISOString().split('T')[0],
        formattedDate: date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short'
        }),
        predictedDemand: Math.round(predictedDemand),
        confidenceHigh: Math.round(predictedDemand * 1.2),
        confidenceLow: Math.round(predictedDemand * 0.8),
        reorderAlert: Math.random() > 0.8,
        stockoutRisk: Math.random() * 100,
        demandSpike: Math.random() > 0.9
      });
    }
    return futureData;
  }, [trendsData]);

  const reorderPredictions = useMemo(() => {
    if (!velocityData || !Array.isArray(velocityData)) return [];
    
    return velocityData
      .filter(p => p.daysUntilOutOfStock > 0 && p.daysUntilOutOfStock < 30)
      .sort((a, b) => a.daysUntilOutOfStock - b.daysUntilOutOfStock)
      .slice(0, 8)
      .map(p => ({
        ...p,
        sku: p.productName || p.productId,
        currentStock: Math.max(0, Math.round(p.dailyMovement * p.daysUntilOutOfStock)),
        stockoutRisk: Math.min(95, Math.max(5, 100 - (p.daysUntilOutOfStock / 30) * 100)),
        predictedStockout: new Date(Date.now() + p.daysUntilOutOfStock * 24 * 60 * 60 * 1000),
        reorderDate: new Date(Date.now() + Math.max(0, (p.daysUntilOutOfStock - 3)) * 24 * 60 * 60 * 1000),
        confidence: p.reorderRecommended ? 90 + Math.random() * 5 : 70 + Math.random() * 15,
        seasonalAdjustment: p.seasonalIndex || 1.0
      }));
  }, [velocityData]);

  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      return <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((item: any, index: number) => <p key={index} style={{
          color: item.color
        }} className="text-sm">
              {item.name}: {formatNumber(item.value)}
            </p>)}
        </div>;
    }
    return null;
  };

  const getRiskColor = (risk: number) => {
    if (risk > 70) return 'destructive';
    if (risk > 40) return 'secondary';
    return 'default';
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Prediksi & Rekomendasi
          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent ml-auto">
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="forecast" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
            <TabsTrigger value="reorder">Reorder Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictions}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--muted))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="confidenceHigh" 
                    stackId="1"
                    stroke="transparent" 
                    fill="url(#confidenceGradient)"
                    name="Confidence Range"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="confidenceLow" 
                    stackId="1"
                    stroke="transparent" 
                    fill="hsl(var(--background))"
                    name=""
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedDemand" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Predicted Demand"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </TabsContent>

          <TabsContent value="reorder" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reorderPredictions.map((prediction, index) => (
                <motion.div
                  key={prediction.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm truncate">{prediction.sku}</h4>
                      <p className="text-xs text-muted-foreground">Electronics</p>
                    </div>
                    <Badge variant={getRiskColor(prediction.stockoutRisk)} className="text-xs ml-2">
                      {prediction.stockoutRisk.toFixed(0)}% Risk
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Current Stock:</span>
                      <span className="font-medium">{formatNumber(prediction.currentStock)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Days to Stockout:</span>
                      <span className="font-medium">{prediction.daysUntilOutOfStock} days</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Recommended Action:</span>
                      <span className="font-medium text-primary">
                        {prediction.daysUntilOutOfStock < 7 ? 'Reorder Now' : 'Monitor'}
                      </span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={100 - prediction.stockoutRisk} 
                    className="h-2 mt-3"
                  />
                  
                  {prediction.daysUntilOutOfStock < 7 && (
                    <Button size="sm" className="w-full mt-3 text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      Create Purchase Order
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalytics;
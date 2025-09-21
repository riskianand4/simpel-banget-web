import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Clock, Target, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/formatters';
import { useSupplierPerformance } from '@/hooks/useAnalyticsData';

const SupplyChainMonitor = () => {
  const { data: rawSupplierData, isLoading, isFromApi } = useSupplierPerformance();

  const supplierPerformance = useMemo(() => {
    if (!rawSupplierData || !Array.isArray(rawSupplierData)) {
      return [];
    }

    return rawSupplierData.map((supplier, index) => ({
      id: supplier.supplierId || `SUP${index + 1}`,
      name: supplier.supplierName || `Supplier ${index + 1}`,
      onTimeDelivery: supplier.onTimeDelivery || 85,
      avgLeadTime: supplier.avgLeadTime || 7,
      qualityScore: supplier.qualityScore || 85,
      totalOrders: supplier.totalOrders || 0,
      costVariance: supplier.costVariance || 0,
      reliability: supplier.reliability || 'good'
    }));
  }, [rawSupplierData]);

  const leadTimeData = useMemo(() => {
    const data = [];
    const baseDate = new Date();
    
    for (let i = 14; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        planned: 5 + Math.random() * 2,
        actual: 4 + Math.random() * 4,
        variance: (Math.random() - 0.5) * 3
      });
    }
    
    return data;
  }, []);

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'fair': return 'text-warning';
      default: return 'text-destructive';
    }
  };

  const getReliabilityBadge = (reliability: string) => {
    switch (reliability) {
      case 'excellent': return { variant: 'default' as const, label: 'Sangat Baik' };
      case 'good': return { variant: 'secondary' as const, label: 'Baik' };
      case 'fair': return { variant: 'outline' as const, label: 'Cukup' };
      default: return { variant: 'destructive' as const, label: 'Perlu Perhatian' };
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}: {formatNumber(item.value)} hari
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
            <Truck className="w-5 h-5 text-primary" />
            Monitor Supply Chain
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
          <Truck className="w-5 h-5 text-primary" />
          Monitor Supply Chain
          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent ml-auto">
            {isFromApi ? 'Live Data' : 'Analytics'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Kinerja Supplier</TabsTrigger>
            <TabsTrigger value="leadtime">Lead Time</TabsTrigger>
            <TabsTrigger value="quality">Quality & Cost</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {supplierPerformance.map((supplier, index) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-sm">{supplier.name}</h4>
                      <p className="text-xs text-muted-foreground">ID: {supplier.id}</p>
                    </div>
                    <Badge {...getReliabilityBadge(supplier.reliability)}>
                      {getReliabilityBadge(supplier.reliability).label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        <span className="text-xs font-medium">On-Time</span>
                      </div>
                      <div className={`text-lg font-bold ${getReliabilityColor(supplier.reliability)}`}>
                        {supplier.onTimeDelivery}%
                      </div>
                      <Progress 
                        value={supplier.onTimeDelivery} 
                        className="h-1 mt-1"
                      />
                    </div>
                    
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium">Lead Time</span>
                      </div>
                      <div className="text-lg font-bold">
                        {supplier.avgLeadTime} hari
                      </div>
                    </div>
                    
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="w-3 h-3 text-accent" />
                        <span className="text-xs font-medium">Quality</span>
                      </div>
                      <div className="text-lg font-bold">
                        {supplier.qualityScore}%
                      </div>
                      <Progress 
                        value={supplier.qualityScore} 
                        className="h-1 mt-1"
                      />
                    </div>
                    
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className={`w-3 h-3 ${supplier.costVariance < 0 ? 'text-success' : 'text-warning'}`} />
                        <span className="text-xs font-medium">Cost Variance</span>
                      </div>
                      <div className={`text-lg font-bold ${supplier.costVariance < 0 ? 'text-success' : 'text-warning'}`}>
                        {supplier.costVariance > 0 ? '+' : ''}{supplier.costVariance.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leadtime" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{ value: 'Hari', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Aktual"
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-card/50 text-center">
                <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-xl font-bold">6.4 hari</div>
                <div className="text-sm text-muted-foreground">Rata-rata Lead Time</div>
              </div>
              
              <div className="p-4 rounded-lg border bg-card/50 text-center">
                <Target className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-xl font-bold">87%</div>
                <div className="text-sm text-muted-foreground">On-Time Delivery</div>
              </div>
              
              <div className="p-4 rounded-lg border bg-card/50 text-center">
                <AlertCircle className="w-6 h-6 text-warning mx-auto mb-2" />
                <div className="text-xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Delayed Orders</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={supplierPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="qualityScore" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{ value: 'Quality Score (%)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="costVariance"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{ value: 'Cost Variance (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">Quality: {data.qualityScore}%</p>
                            <p className="text-sm">Cost Variance: {data.costVariance}%</p>
                            <p className="text-sm">Reliability: {getReliabilityBadge(data.reliability).label}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={supplierPerformance} 
                    fill="hsl(var(--primary))"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SupplyChainMonitor;
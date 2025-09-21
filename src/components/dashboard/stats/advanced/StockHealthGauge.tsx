import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Activity, Target, Zap, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';
import { useStockHealthGauge } from '@/hooks/useAnalyticsData';

const StockHealthGauge = () => {
  const { data: healthData, isLoading, isFromApi } = useStockHealthGauge();

  const healthMetrics = useMemo(() => {
    if (!healthData) {
      return [
        { name: 'Ketersediaan', value: 0, icon: CheckCircle, color: 'hsl(var(--muted))', description: 'Produk tersedia ketika dibutuhkan' },
        { name: 'Akurasi', value: 0, icon: Target, color: 'hsl(var(--muted))', description: 'Keakuratan data inventori' },
        { name: 'Kecepatan', value: 0, icon: Zap, color: 'hsl(var(--muted))', description: 'Kecepatan perputaran stok' },
        { name: 'Kualitas', value: 0, icon: Shield, color: 'hsl(var(--muted))', description: 'Kualitas manajemen stok' }
      ];
    }

    return [
      {
        name: 'Ketersediaan',
        value: healthData.availability || 0,
        icon: CheckCircle,
        color: 'hsl(var(--success))',
        description: 'Produk tersedia ketika dibutuhkan'
      },
      {
        name: 'Akurasi',
        value: healthData.accuracy || 0,
        icon: Target,
        color: 'hsl(var(--primary))',
        description: 'Keakuratan data inventori'
      },
      {
        name: 'Kecepatan',
        value: healthData.velocity || 0,
        icon: Zap,
        color: 'hsl(var(--warning))',
        description: 'Kecepatan perputaran stok'
      },
      {
        name: 'Kualitas',
        value: healthData.quality || 0,
        icon: Shield,
        color: 'hsl(var(--accent))',
        description: 'Kualitas manajemen stok'
      }
    ];
  }, [healthData]);

  const overallHealth = useMemo(() => {
    return healthData?.overall || 0;
  }, [healthData]);

  const gaugeData = useMemo(() => [
    {
      name: 'Health',
      value: overallHealth,
      fill: overallHealth > 85 ? 'hsl(var(--success))' : 
            overallHealth > 70 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'
    },
    {
      name: 'Remaining',
      value: 100 - overallHealth,
      fill: 'hsl(var(--muted))'
    }
  ], [overallHealth]);

  const getHealthColor = (value: number) => {
    if (value >= 90) return 'text-success';
    if (value >= 80) return 'text-warning';
    if (value >= 70) return 'text-orange-500';
    return 'text-destructive';
  };

  const getHealthStatus = (value: number) => {
    if (value >= 90) return { status: 'Sangat Baik', variant: 'default' as const };
    if (value >= 80) return { status: 'Baik', variant: 'secondary' as const };
    if (value >= 70) return { status: 'Cukup', variant: 'outline' as const };
    return { status: 'Perlu Perhatian', variant: 'destructive' as const };
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Kesehatan Stok
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
          <Activity className="w-5 h-5 text-primary" />
          Kesehatan Stok
          <Badge variant={getHealthStatus(overallHealth).variant} className="text-xs ml-auto">
            {getHealthStatus(overallHealth).status}
          </Badge>
          {isFromApi && (
            <Badge variant="secondary" className="text-xs bg-success/20 text-success">
              Live Data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Health Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getHealthColor(overallHealth)}`}>
                  {overallHealth}%
                </span>
                <span className="text-sm text-muted-foreground">
                  Kesehatan Overall
                </span>
              </div>
            </div>
          </motion.div>

          {/* Detailed Metrics */}
          <div className="space-y-4">
            {healthMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${metric.color}20` }}
                      >
                        <IconComponent 
                          className="w-4 h-4" 
                          style={{ color: metric.color }}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{metric.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getHealthColor(metric.value)}`}>
                        {metric.value}%
                      </span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={metric.value} 
                    className="h-2"
                    style={{
                      '--progress-background': metric.color
                    } as React.CSSProperties}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Summary Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Ringkasan Analisis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Kesehatan stok secara keseluruhan dalam kondisi{' '}
            <span className={getHealthColor(overallHealth)}>
              {getHealthStatus(overallHealth).status.toLowerCase()}
            </span>
            . {overallHealth >= 85 
              ? 'Sistem inventori berjalan dengan sangat baik.' 
              : overallHealth >= 70 
              ? 'Beberapa area memerlukan optimisasi.'
              : 'Perlu perhatian khusus pada manajemen stok.'
            }
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default StockHealthGauge;
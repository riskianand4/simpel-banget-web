import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, StatsCardSkeleton } from '@/components/ui/loading-skeleton';
import { TrendingUp, BarChart3, PieChart, Activity, Target, Zap, Calendar, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';
import { usePSBAnalytics } from '@/hooks/usePSBAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export const PSBAnalytics: React.FC = () => {
  const {
    analytics,
    loading,
    error,
    refreshAnalytics
  } = usePSBAnalytics();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    // Check connection status
    if (analytics) {
      setConnectionStatus('connected');
    } else if (error) {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('checking');
    }
  }, [analytics, error]);

  const generatePerformanceData = () => {
    if (!analytics) return [];
    return analytics.clusterStats.slice(0, 8).map(cluster => ({
      name: cluster._id,
      performance: cluster.count > 0 ? cluster.completed / cluster.count * 100 : 0,
      total: cluster.count,
      completed: cluster.completed
    }));
  };

  const generateRadialData = () => {
    if (!analytics) return [];
    const {
      summary
    } = analytics;
    return [{
      name: 'Completed',
      value: summary.completedOrders,
      fill: 'hsl(var(--chart-1))'
    }, {
      name: 'In Progress',
      value: summary.inProgressOrders,
      fill: 'hsl(var(--chart-2))'
    }, {
      name: 'Pending',
      value: summary.pendingOrders,
      fill: 'hsl(var(--chart-3))'
    }];
  };

  if (loading) {
    return <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-32 sm:w-48" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Skeleton className="h-8 sm:h-9 w-24 sm:w-32" />
            <Skeleton className="h-8 sm:h-9 w-28 sm:w-36" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <Card key={i} className="bg-gradient-to-br from-muted/50 to-muted/20 border relative overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 sm:space-y-3">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-2 sm:h-3 w-2 sm:w-3 rounded-full" />
                      <Skeleton className="h-2 sm:h-3 w-8 sm:w-12" />
                      <Skeleton className="h-2 sm:h-3 w-12 sm:w-16" />
                    </div>
                  </div>
                  <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Advanced Charts Skeleton */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <Skeleton className="h-5 sm:h-6 w-48 sm:w-56" />
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <Skeleton className="h-[250px] sm:h-[350px] w-full" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <Skeleton className="h-[250px] sm:h-[350px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Cluster Performance Skeleton */}
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <Skeleton className="h-5 sm:h-6 w-56 sm:w-64" />
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <Skeleton className="h-[300px] sm:h-[400px] w-full" />
          </CardContent>
        </Card>

        {/* Performance Insights Skeleton */}
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                </div>
                <Skeleton className="h-2 sm:h-3 w-full" />
                <Skeleton className="h-2 sm:h-3 w-3/4 mt-1" />
              </div>
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
                </div>
                <Skeleton className="h-2 sm:h-3 w-full" />
                <Skeleton className="h-2 sm:h-3 w-2/3 mt-1" />
              </div>
            </div>
            <div className="pt-4 border-t">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 mb-3" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 rounded-full" />
                <Skeleton className="h-5 sm:h-6 w-36 sm:w-44 rounded-full" />
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  if (!analytics && !loading) {
    return <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <Alert className="border-yellow-300 bg-primary/10 mx-2 sm:mx-0"> 
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <AlertDescription className="text-yellow-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                <strong className="block sm:inline">Backend PSB Service Tidak Tersedia</strong>
                <p className="text-xs sm:text-sm mt-1 break-words">
                  {error || 'Analytics data tidak dapat dimuat. Periksa koneksi backend.'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {connectionStatus === 'connected' ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                <span className="text-xs capitalize">{connectionStatus}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-6 sm:py-8 px-4">
          <Activity className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">Analytics data tidak tersedia</p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
            Backend server mungkin tidak berjalan atau endpoint /api/psb-orders/analytics tidak dapat diakses
          </p>
          <Button onClick={refreshAnalytics} className="mt-4" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>;
  }

  return <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
      {/* Header */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3
    }} className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent break-words">
            Advanced Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
            Deep insights dan prediksi performa PSB menggunakan AI analytics
          </p>
        </div>
        <div className="flex flex-row sm:flex-row gap-2 sm:gap-3 flex-shrink-0  ">
          <Button onClick={refreshAnalytics} variant="outline" size="sm" className="text-xs w-full sm:text-sm">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Refresh Data
          </Button>
          <Button size="sm" className="text-xs sm:text-sm w-full">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Custom Period
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      delay: 0.1
    }} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="glass hover-lift relative overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Total Orders</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{analytics.summary.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1 sm:mt-2">
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift relative overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Success Rate</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{analytics.summary.completionRate}%</p>
                <div className="flex items-center gap-1 mt-1 sm:mt-2">
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success text-success-foreground rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift relative overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Avg. Completion</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">4.2d</p>
                <div className="flex items-center gap-1 mt-1 sm:mt-2">
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent text-accent-foreground rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift relative overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Active Clusters</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{analytics.clusterStats.length}</p>
                <div className="flex items-center gap-1 mt-1 sm:mt-2">
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning text-warning-foreground rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Performance Trend */}
        <motion.div className="lg:col-span-2" initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3,
        delay: 0.2
      }}>
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Performance Trend Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={350} className="sm:!h-[350px]">
                <AreaChart data={analytics.monthlyTrends.reverse()}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="_id" 
                    tickFormatter={value => `${value.month}/${value.year}`} 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    className="sm:text-xs"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} className="sm:text-xs" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                    labelFormatter={(value: any) => `${value.month}/${value.year}`} 
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} name="Total Orders" />
                  <Area type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3,
        delay: 0.3
      }}>
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Status Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={350} className="sm:!h-[350px]">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={generateRadialData()}>
                  <RadialBar label={{
                  position: 'insideStart',
                  fill: '#fff',
                  fontSize: 10
                }} background dataKey="value" />
                  <Legend iconSize={8} wrapperStyle={{
                  color: 'hsl(var(--foreground))',
                  fontSize: '10px'
                }} className="sm:text-xs" />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cluster Performance Analysis */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      delay: 0.4
    }}>
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="truncate">Cluster Performance Benchmarking</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={400} className="sm:!h-[400px]">
              <BarChart data={generatePerformanceData()} margin={{
              top: 20,
              right: 10,
              left: 10,
              bottom: 0
            }} className="sm:!mr-[30px] sm:!ml-[20px] sm:!mb-[60px]">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={10} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={9}
                  className="sm:text-xs"
                />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={9} className="sm:text-xs" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={9} className="sm:text-xs" />
                <Tooltip contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }} />
                <Bar yAxisId="left" dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Orders" />
                <Bar yAxisId="left" dataKey="completed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Completed" />
                <Line yAxisId="right" type="monotone" dataKey="performance" stroke="hsl(var(--chart-3))" strokeWidth={3} name="Performance %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>;
};
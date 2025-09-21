import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, StatsCardSkeleton } from '@/components/ui/loading-skeleton';
import { BarChart3, Users, FileText, TrendingUp, CheckCircle, Clock, AlertTriangle, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePSBAnalytics } from '@/hooks/usePSBAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const PSBDashboard: React.FC = () => {
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

  if (loading) {
    return <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-20 sm:w-24" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-36" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Skeleton */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {Array.from({
              length: 10
            }).map((_, i) => <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 sm:p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 ml-5 sm:ml-0">
                    <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-full" />
                    <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
                    <Skeleton className="h-3 sm:h-4 w-6 sm:w-8" />
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  if (!analytics && !loading) {
    return <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
        <Alert className="border-yellow-300 bg-primary/10">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex-1">
                <strong>Koneksi Backend Bermasalah</strong>
                <p className="text-sm mt-1">
                  {error || 'Backend PSB service tidak dapat dijangkau. Menampilkan mode offline.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                <span className="text-xs capitalize">{connectionStatus}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-6 sm:py-8">
          <AlertTriangle className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">Backend PSB service tidak tersedia</p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 px-2">
            Periksa apakah backend server berjalan di port 3001 dan endpoint /api/psb-orders dapat diakses
          </p>
          <Button onClick={refreshAnalytics} className="mt-4 w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>;
  }

  const statusData = [{
    name: 'Completed',
    value: analytics.summary.completedOrders,
    color: COLORS[0]
  }, {
    name: 'In Progress',
    value: analytics.summary.inProgressOrders,
    color: COLORS[1]
  }, {
    name: 'Pending',
    value: analytics.summary.pendingOrders,
    color: COLORS[2]
  }];

  return <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard PSB</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Monitoring dan analisis data PSB secara real-time
          </p>
        </div>
        <Button onClick={refreshAnalytics} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analytics.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Semua order PSB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {analytics.summary.completedOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Order selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {analytics.summary.inProgressOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sedang dikerjakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analytics.summary.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tingkat penyelesaian
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Distribusi Status Order</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={statusData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false} 
                  label={({name, value, percent}) => window.innerWidth < 640 ? 
                    `${name.split(' ')[0]}: ${value}` : 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={window.innerWidth < 640 ? 60 : 80} 
                  fill="#8884d8" 
                  dataKey="value"
                >
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clusters */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Top Clusters</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.clusterStats.slice(0, window.innerWidth < 640 ? 5 : 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                  interval={0}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top STOs */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Top STOs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.stoStats.slice(0, window.innerWidth < 640 ? 5 : analytics.stoStats.length)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                  interval={0}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Trend Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.monthlyTrends.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  tickFormatter={value => `${value.month}/${value.year}`}
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                  angle={window.innerWidth < 640 ? -45 : 0}
                  textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                  height={window.innerWidth < 640 ? 60 : 30}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip labelFormatter={(value: any) => `${value.month}/${value.year}`} />
                <Bar dataKey="count" name="Total" fill="hsl(var(--primary))" />
                <Bar dataKey="completed" name="Completed" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Statistik Cluster</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3">
            {analytics.clusterStats.slice(0, 10).map(cluster => 
              <div key={cluster._id} className="flex flex-row justify-between  sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="font-medium text-sm sm:text-base truncate">{cluster._id}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 ml-5 sm:ml-0 flex-wrap">
                  <Badge variant="outline" className="text-xs">{cluster.count} total</Badge>
                  <Badge variant="secondary" className="text-xs">{cluster.completed} selesai</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {cluster.count > 0 ? (cluster.completed / cluster.count * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>;
};
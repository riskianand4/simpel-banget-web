import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, StatsCardSkeleton } from '@/components/ui/loading-skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Download, Calendar, Filter, TrendingUp, BarChart3, PieChart, Users, Package, Clock, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { usePSBAnalytics } from '@/hooks/usePSBAnalytics';

const reportTypes = [{
  id: 'summary',
  title: 'Laporan Summary',
  description: 'Ringkasan performa PSB secara keseluruhan',
  icon: BarChart3,
  color: 'bg-blue-500'
}, {
  id: 'cluster',
  title: 'Laporan per Cluster',
  description: 'Analisis performa berdasarkan cluster',
  icon: PieChart,
  color: 'bg-green-500'
}, {
  id: 'technician',
  title: 'Laporan Teknisi',
  description: 'Evaluasi performa teknisi lapangan',
  icon: Users,
  color: 'bg-purple-500'
}, {
  id: 'package',
  title: 'Laporan Paket',
  description: 'Analisis berdasarkan jenis paket layanan',
  icon: Package,
  color: 'bg-orange-500'
}];

export const PSBReports: React.FC = () => {
  const { analytics, loading, refreshAnalytics } = usePSBAnalytics();
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  } | undefined>();

  const handleExportReport = (reportType: string) => {
    // toast.success(`Export laporan ${reportType} akan segera dimulai`);
    console.log(`Export laporan ${reportType} akan segera dimulai`);
  };

  const generateTrendData = () => {
    if (!analytics) return [];
    return analytics.monthlyTrends.map(trend => ({
      month: `${trend._id.month}/${trend._id.year}`,
      total: trend.count,
      completed: trend.completed,
      pending: trend.count - trend.completed
    }));
  };

  const handleGenerateSampleData = async () => {
    try {
      const response = await fetch('/api/psb-orders/generate-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        await refreshAnalytics();
        console.log('Sample data generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate sample data:', error);
    }
  };

  if (loading) {
    return <div className="space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-40 sm:w-48" />
            <Skeleton className="h-3 sm:h-4 w-80 sm:w-96" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Skeleton className="h-8 sm:h-9 w-full sm:w-32" />
            <Skeleton className="h-8 sm:h-9 w-full sm:w-32" />
          </div>
        </div>

        {/* Report Type Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <Card key={i}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Skeleton className="h-2 sm:h-3 w-28 sm:w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Detail Report Skeleton */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <Skeleton className="h-4 sm:h-5 w-28 sm:w-32" />
                <div className="space-y-2">
                  {Array.from({
                  length: 4
                }).map((_, i) => <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                      <Skeleton className="h-5 sm:h-6 w-10 sm:w-12" />
                    </div>)}
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 sm:h-5 w-28 sm:w-32" />
                <div className="space-y-2">
                  {Array.from({
                  length: 5
                }).map((_, i) => <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <Skeleton className="h-3 sm:h-4 w-28 sm:w-32" />
                      <div className="flex gap-1 sm:gap-2">
                        <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
                        <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
              <Skeleton className="h-8 sm:h-9 w-full sm:w-28" />
              <Skeleton className="h-8 sm:h-9 w-full sm:w-32" />
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  return <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3
    }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Laporan PSB
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Generate dan analisis laporan performa PSB secara detail
          </p>
        </div>
        <div className="flex flex-row sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Pilih Periode</span>
            <span className="xs:hidden">Periode</span>
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => handleExportReport(selectedReport)}>
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Export Laporan</span>
            <span className="xs:hidden">Export</span>
          </Button>
        </div>
      </motion.div>

      {/* Report Type Selection */}
      <TooltipProvider>
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
          {reportTypes.map((report, index) => <motion.div key={report.id} initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.3,
          delay: index * 0.1
        }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className={`cursor-pointer transition-all duration-300 hover:shadow-lg h-[120px] sm:h-[140px] ${selectedReport === report.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`} onClick={() => setSelectedReport(report.id)}>
                    <CardContent className="p-4 sm:p-6 h-full">
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 ${report.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <report.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          {selectedReport === report.id && <Badge variant="default" className="text-xs ml-auto">Active</Badge>}
                        </div>
                        <div className="flex-1 mt-2 sm:mt-3">
                          <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-1">{report.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-2">
                            {report.description.length > 30 ? `${report.description.substring(0, 30)}...` : report.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs p-4 hidden sm:block">
                  <div className="space-y-2">
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Klik untuk memilih jenis laporan ini</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>)}
        </motion.div>
      </TooltipProvider>

      {/* Empty State for No Data */}
      {analytics && analytics.summary.totalOrders === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center py-8 sm:py-12"
        >
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Belum Ada Data PSB</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
                    Sistem belum memiliki data order PSB. Mulai dengan menambahkan data sample untuk melihat analytics.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <Button onClick={handleGenerateSampleData} className="flex items-center gap-2 w-full sm:w-auto">
                    <Package className="h-4 w-4" />
                    Generate Sample Data
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.location.href = '/psb-input'}>
                    <FileText className="h-4 w-4 mr-2" />
                    Tambah Data Manual
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : analytics && analytics.summary.totalOrders > 0 ? (
        <>
          {/* Summary Stats */}
          <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        delay: 0.2
      }} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="glass hover-lift">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Orders</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{analytics.summary.totalOrders}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <FileText className="h-3 w-3 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Completed</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{analytics.summary.completedOrders}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-success/10 text-success rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">In Progress</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{analytics.summary.inProgressOrders}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-warning/10 text-warning rounded-lg flex items-center justify-center">
                    <Clock className="h-3 w-3 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Success Rate</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{analytics.summary.completionRate}%</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Monthly Trend */}
            <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.3,
          delay: 0.3
        }}>
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    Trend Bulanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={generateTrendData().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="total" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Total Orders" />
                      <Area type="monotone" dataKey="completed" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Completed" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cluster Performance */}
            <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.3,
          delay: 0.4
        }}>
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    Performa Cluster
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.clusterStats.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="_id" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60} 
                        tick={{ fontSize: 10 }}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Total Orders" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Completed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Report Section */}
          <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        delay: 0.5
      }}>
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="line-clamp-1">
                    Laporan Detail - {reportTypes.find(r => r.id === selectedReport)?.title}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedReport === 'summary' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm sm:text-base">Ringkasan Performa</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-muted/50 rounded text-sm">
                          <span>Total Order PSB</span>
                          <Badge variant="outline">{analytics.summary.totalOrders}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-muted/50 rounded text-sm">
                          <span>Order Selesai</span>
                          <Badge variant="secondary">{analytics.summary.completedOrders}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-muted/50 rounded text-sm">
                          <span>Dalam Proses</span>
                          <Badge variant="outline">{analytics.summary.inProgressOrders}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-muted/50 rounded text-sm">
                          <span>Tingkat Keberhasilan</span>
                          <Badge variant="default">{analytics.summary.completionRate}%</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm sm:text-base">Top 5 Cluster</h4>
                      <div className="space-y-2">
                        {analytics.clusterStats.slice(0, 5).map((cluster, index) => <div key={cluster._id} className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 p-2 sm:p-3 bg-muted/50 rounded text-sm">
                            <span className="font-medium">#{index + 1} {cluster._id}</span>
                            <div className="flex flex-wrap gap-1 xs:gap-2">
                              <Badge variant="outline" className="text-xs">{cluster.count} total</Badge>
                              <Badge variant="secondary" className="text-xs">{cluster.completed} selesai</Badge>
                            </div>
                          </div>)}
                      </div>
                    </div>
                  </div>}

                {selectedReport === 'cluster' && <div className="space-y-4">
                    <h4 className="font-semibold text-sm sm:text-base">Analisis per Cluster</h4>
                    <div className="grid gap-2 sm:gap-3 max-h-96 overflow-y-auto">
                      {analytics.clusterStats.map((cluster, index) => <motion.div key={cluster._id} initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  duration: 0.3,
                  delay: index * 0.05
                }} className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-xs sm:text-sm font-bold text-primary">#{index + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{cluster._id}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Success Rate: {cluster.count > 0 ? (cluster.completed / cluster.count * 100).toFixed(1) : 0}%
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">{cluster.count} orders</Badge>
                            <Badge variant="secondary" className="text-xs">{cluster.completed} completed</Badge>
                          </div>
                        </motion.div>)}
                    </div>
                  </div>}

                <div className="flex flex-row sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                  <Button className="w-full sm:w-auto" onClick={() => handleExportReport(selectedReport)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => handleExportReport(selectedReport)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        /* Connection Error State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center py-8 sm:py-12"
        >
          <Card className="max-w-2xl mx-auto border-destructive/50">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-destructive">Koneksi Backend Bermasalah</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
                    Backend PSB service tidak dapat dijangkau. Menampilkan mode offline.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <Button onClick={refreshAnalytics} variant="outline" className="w-full sm:w-auto">
                    <Clock className="h-4 w-4 mr-2" />
                    Coba Lagi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>;
};
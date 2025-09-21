import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, TrendingUp, TrendingDown, Package, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useApi } from '@/contexts/ApiContext';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
const StockReportsManager = () => {
  const { apiService, isConfigured, isOnline } = useApi();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [reportType, setReportType] = useState('summary');
  const [products, setProducts] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check for auto-generate parameter
  const shouldAutoGenerate = searchParams.get('generate') === 'true';

  // Fetch data from backend
  useEffect(() => {
    const loadData = async () => {
      if (!isConfigured || !isOnline || !apiService) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [productsResponse, movementsResponse] = await Promise.all([
          apiService.getProducts(),
          apiService.request('/api/stock/movements')
        ]);

        if (productsResponse?.success) {
          setProducts(productsResponse.data || []);
        }
        if (movementsResponse?.success) {
          setStockMovements(Array.isArray(movementsResponse.data) ? movementsResponse.data : []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: "Error",
          description: "Failed to load stock data. Please check your API configuration.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isConfigured, isOnline]);

  // Auto-generate report if requested
  useEffect(() => {
    if (shouldAutoGenerate && !isLoading && products.length > 0) {
      // Wait a moment for data to settle, then auto-export
      setTimeout(() => {
        handleExportExcel();
        toast({
          title: "Success",
          description: "Laporan stok berhasil digenerate dan didownload!",
        });
      }, 1000);
    }
  }, [shouldAutoGenerate, isLoading, products.length]);

  // Generate stock report data
  const stockReportData = useMemo(() => {
    return products.map(product => {
      // Match movements with product using actual API structure
      const movements = stockMovements.filter(m => 
        (m.product && m.product._id === product.id) ||
        (m.product && m.product.id === product.id)
      );
      
      // Sort movements by date to get chronological order
      const sortedMovements = movements.sort((a, b) => 
        new Date(a.createdAt || a.timestamp).getTime() - new Date(b.createdAt || b.timestamp).getTime()
      );
      
      const stockIn = movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0);
      const stockOut = movements.filter(m => m.type === 'out' || m.type === 'damage').reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      const adjustments = movements.filter(m => m.type === 'adjustment' || m.type === 'count').reduce((sum, m) => sum + m.quantity, 0);
      
      // Get initial stock from the first movement's previousStock, or use current stock if no movements
      const currentStock = product.stock?.current || product.stock || 0;
      let initialStock = currentStock;
      
      if (sortedMovements.length > 0) {
        // Use previousStock from the earliest movement as initial stock
        const firstMovement = sortedMovements[0];
        initialStock = firstMovement.previousStock || 0;
      } else if (stockIn === 0 && stockOut === 0 && adjustments === 0) {
        // If no movements, initial stock equals current stock
        initialStock = currentStock;
      }
      
      return {
        ...product,
        stockIn,
        stockOut,
        adjustments,
        initialStock,
        finalStock: currentStock,
        turnover: currentStock > 0 ? (stockOut / currentStock) * 100 : 0
      };
    });
  }, [products, stockMovements]);

  // Filter by category and location
  const filteredData = useMemo(() => {
    let filtered = stockReportData;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    return filtered;
  }, [stockReportData, selectedCategory, selectedLocation]);

  // Get unique categories and locations
  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);
  const locations = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.location).filter(Boolean)))];
  }, [products]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalValue = filteredData.reduce((sum, item) => sum + item.price * item.finalStock, 0);
    const totalStockIn = filteredData.reduce((sum, item) => sum + item.stockIn, 0);
    const totalStockOut = filteredData.reduce((sum, item) => sum + item.stockOut, 0);
    const averageTurnover = filteredData.length > 0 ? filteredData.reduce((sum, item) => sum + item.turnover, 0) / filteredData.length : 0;
    return {
      totalItems: filteredData.length,
      totalValue,
      totalStockIn,
      totalStockOut,
      averageTurnover
    };
  }, [filteredData]);
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      'Kode': item.sku,
      'Nama Barang': item.name,
      'Kategori': item.category,
      'Harga Beli': item.price * 0.8,
      // Assuming 20% margin
      'Harga Jual': item.price,
      'Satuan': 'pcs',
      'Stok Awal': item.initialStock,
      'Barang Masuk': item.stockIn,
      'Barang Keluar': item.stockOut,
      'Penyesuaian': item.adjustments,
      'Stok Akhir': item.finalStock,
      'Nilai Stok': item.price * item.finalStock,
      'Perputaran (%)': item.turnover.toFixed(2),
      'Lokasi': item.location || '-',
      'Status': item.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Stok');

    // Add summary sheet
    const summaryWS = XLSX.utils.json_to_sheet([{
      'Metrik': 'Total Item',
      'Nilai': summaryStats.totalItems
    }, {
      'Metrik': 'Total Nilai Stok',
      'Nilai': summaryStats.totalValue
    }, {
      'Metrik': 'Total Barang Masuk',
      'Nilai': summaryStats.totalStockIn
    }, {
      'Metrik': 'Total Barang Keluar',
      'Nilai': summaryStats.totalStockOut
    }, {
      'Metrik': 'Rata-rata Perputaran (%)',
      'Nilai': summaryStats.averageTurnover.toFixed(2)
    }]);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Ringkasan');
    XLSX.writeFile(workbook, `Laporan_Stok_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-success';
      case 'low_stock':
        return 'bg-warning';
      case 'out_of_stock':
        return 'bg-destructive';
      default:
        return 'bg-secondary';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'Tersedia';
      case 'low_stock':
        return 'Stok Menipis';
      case 'out_of_stock':
        return 'Stok Habis';
      default:
        return status;
    }
  };
  return <div className="min-h-screen bg-muted/10 p-3 sm:p-4 lg:p-6">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 sm:mb-0">Laporan Stok Barang</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Generate dan download laporan stok inventory</p>
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            <Button variant="outline" onClick={handleExportExcel} className="w-full sm:w-auto h-10 sm:h-11">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[{
          label: 'Total Item',
          value: summaryStats.totalItems.toLocaleString(),
          icon: Package,
          color: 'primary'
        }, {
          label: 'Nilai Total Stok',
          value: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(summaryStats.totalValue),
          icon: TrendingUp,
          color: 'success'
        }, {
          label: 'Barang Masuk',
          value: summaryStats.totalStockIn.toLocaleString(),
          icon: TrendingUp,
          color: 'info'
        }, {
          label: 'Barang Keluar',
          value: summaryStats.totalStockOut.toLocaleString(),
          icon: TrendingDown,
          color: 'warning'
        }, {
          label: 'Perputaran Rata-rata',
          value: `${summaryStats.averageTurnover.toFixed(1)}%`,
          icon: AlertCircle,
          color: 'accent'
        }].map((stat, index) => <motion.div key={stat.label} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: index * 0.1
        }}>
              <Card className="glass hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`p-2 rounded-lg bg-${stat.color}/10 flex-shrink-0`}>
                      <stat.icon className={`w-4 h-4 text-${stat.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                      <p className={`text-sm sm:text-base lg:text-lg font-bold text-${stat.color} truncate`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>)}
        </div>

        {/* Filters */}
        <Card className="glass">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="text-sm sm:text-base font-medium text-foreground">Filter Laporan</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full bg-background h-10 sm:h-11">
                    <SelectValue placeholder="Jenis Laporan" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    <SelectItem value="summary">Ringkasan Stok</SelectItem>
                    <SelectItem value="movement">Pergerakan Stok</SelectItem>
                    <SelectItem value="analysis">Analisis Stok</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full bg-background h-10 sm:h-11">
                    <SelectValue placeholder="Periode" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="yearly">Tahunan</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full bg-background h-10 sm:h-11">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.slice(1).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full bg-background h-10 sm:h-11">
                    <SelectValue placeholder="Lokasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    <SelectItem value="all">Semua Lokasi</SelectItem>
                    {locations.slice(1).map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Report Table */}
        <Card className="glass">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-base sm:text-lg font-semibold">Data Stok Barang</span>
              </div>
              <Badge variant="secondary" className="text-xs self-start sm:self-center">{filteredData.length} item</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading stock data...</span>
              </div>
            ) : !isConfigured ? (
              <div className="text-center p-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">API not configured</p>
                <p className="text-sm">Please configure your API settings to load stock data.</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No stock data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[800px] lg:min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] sm:w-[120px]">Kode</TableHead>
                    <TableHead className="w-[150px] sm:w-[200px]">Nama Barang</TableHead>
                    <TableHead className="w-[100px] sm:w-[120px]">Kategori</TableHead>
                    <TableHead className="text-right w-[100px] sm:w-[120px]">Harga</TableHead>
                    <TableHead className="text-center w-[80px] sm:w-[100px]">Stok Awal</TableHead>
                    <TableHead className="text-center w-[80px] sm:w-[100px]">Masuk</TableHead>
                    <TableHead className="text-center w-[80px] sm:w-[100px]">Keluar</TableHead>
                    <TableHead className="text-center w-[80px] sm:w-[100px]">Stok Akhir</TableHead>
                    <TableHead className="text-right w-[120px] sm:w-[140px]">Nilai Stok</TableHead>
                    <TableHead className="text-center w-[100px] sm:w-[120px]">Perputaran</TableHead>
                    <TableHead className="w-[100px] sm:w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(item => <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs sm:text-sm">{item.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-xs sm:text-sm line-clamp-2">{item.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.location}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.category}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      notation: 'compact'
                    }).format(item.price)}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm">{item.initialStock}</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm text-success">{item.stockIn}</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm text-warning">{item.stockOut}</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm font-medium">{item.finalStock}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      notation: 'compact'
                    }).format(item.price * item.finalStock)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.turnover > 50 ? "default" : "secondary"} className="text-xs">
                          {item.turnover.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(item.status)} text-xs`}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>;
};
export default StockReportsManager;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, Eye, Edit, RotateCcw, Plus, Minus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProducts } from '@/contexts/ProductContext';
import { getProductStockStatus } from '@/utils/productStatusHelpers';
import { debugStockCalculation, getStockInsights } from '@/utils/stockValidation';
import { useToast } from '@/hooks/use-toast';
import { WAREHOUSE_LOCATIONS } from '@/data/constants';
import { StockAlertBanner } from '@/components/alerts/StockAlertBanner';
// Remove InventoryItem interface since we'll use Product from types
interface InventoryOverviewProps {
  onStockAdjustment?: (productId: string) => void;
}
const InventoryOverview = ({
  onStockAdjustment
}: InventoryOverviewProps) => {
  const { toast } = useToast();
  const {
    products: inventoryItems,
    isLoading,
    error,
    isFromApi,
    refreshProducts: refresh,
    isOnline
  } = useProducts();

  const lastUpdated = new Date(); // Use current time as placeholder
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
    const itemStatus = getProductStockStatus(item);
    const matchesStatus = selectedStatus === 'all' || itemStatus === selectedStatus;
    return matchesSearch && matchesLocation && matchesStatus;
  });
  const handleRefresh = async () => {
    try {
      await refresh();
      toast({
        title: "Data Refreshed",
        description: "Inventory data has been updated successfully"
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh inventory data",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-success text-success-foreground';
      case 'low_stock':
        return 'bg-warning text-warning-foreground';
      case 'out_of_stock':
        return 'bg-destructive text-destructive-foreground';
      case 'overstock':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'Stok Normal';
      case 'low_stock':
        return 'Stok Rendah';
      case 'out_of_stock':
        return 'Stok Habis';
      case 'overstock':
        return 'Stok Berlebih';
      default:
        return status;
    }
  };
  const getTrendIcon = (item: any) => {
    const status = getProductStockStatus(item);
    if (status === 'out_of_stock') return <TrendingDown className="w-4 h-4 text-destructive" />;
    if (status === 'low_stock') return <TrendingDown className="w-4 h-4 text-warning" />;
    return <TrendingUp className="w-4 h-4 text-success" />;
  };
  const getStockPercentage = (item: any) => {
    // Handle edge cases first
    if (item.stock === 0) {
      return 0;
    }

    if (!item.maxStock || item.maxStock === 0) {
      // If no maxStock set, use smart calculation based on minStock
      if (item.minStock > 0) {
        // Use minStock * 3 as reference for "healthy" stock level
        const referenceMax = item.minStock * 3;
        const percentage = Math.min(Math.round((item.stock / referenceMax) * 100), 100);
        return percentage;
      } else {
        // If minStock is also 0, use a fixed reference of 50 units
        const referenceMax = 50;
        const percentage = Math.min(Math.round((item.stock / referenceMax) * 100), 100);
        return percentage;
      }
    }

    const percentage = Math.round((item.stock / item.maxStock) * 100);
    return Math.min(percentage, 100);
  };
  const handleViewDetail = (item: any) => {
    // Debug stock calculation when viewing details
    debugStockCalculation(item);
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const stats = {
    total: inventoryItems.length,
    inStock: inventoryItems.filter(i => getProductStockStatus(i) === 'in_stock').length,
    lowStock: inventoryItems.filter(i => getProductStockStatus(i) === 'low_stock').length,
    outOfStock: inventoryItems.filter(i => getProductStockStatus(i) === 'out_of_stock').length,
    totalValue: inventoryItems.reduce((sum, item) => sum + (item.price * item.stock), 0)
  };
  if (isLoading) {
    return <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({
          length: 4
        }).map((_, i) => <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2 p-3 sm:p-6">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-32" />
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return <div className="space-y-4 sm:space-y-6 p-0 sm:p-6">
      {/* Stock Alert Banner */}
      <StockAlertBanner
        products={inventoryItems}
        onViewProduct={(productId) => {
          const product = inventoryItems.find(p => p.id === productId);
          if (product) {
            setSelectedItem(product);
            setDetailDialogOpen(true);
          }
        }}
      />

      {/* Statistics Overview */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3
    }} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-4">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Item dalam inventori</p>
          </CardContent>
        </Card>

        <Card className="bg-success/10 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Stok Normal</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-4">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-success">{stats.inStock}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Produk dengan stok aman</p>
          </CardContent>
        </Card>

        <Card className="bg-warning/10 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Alert Stok</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-4">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-warning">{stats.lowStock + stats.outOfStock}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Perlu perhatian segera</p>
          </CardContent>
        </Card>

        <Card className="bg-accent/10 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Nilai Inventori</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-info" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-4">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-info">
              Rp {(stats.totalValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total nilai stok</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div className="flex flex-col gap-3 sm:gap-4" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      delay: 0.1
    }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Cari produk, kode, atau kategori..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-muted/50 h-10 sm:h-12" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full h-10 sm:h-12">
              <SelectValue placeholder="Semua Lokasi" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
              <SelectItem value="all" className="hover:bg-accent hover:text-accent-foreground cursor-pointer">
                Semua Lokasi
              </SelectItem>
              {WAREHOUSE_LOCATIONS.map((location) => (
                <SelectItem 
                  key={location} 
                  value={location}
                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full h-10 sm:h-12">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="in_stock">Stok Normal</SelectItem>
              <SelectItem value="low_stock">Stok Rendah</SelectItem>
              <SelectItem value="out_of_stock">Stok Habis</SelectItem>
              <SelectItem value="overstock">Stok Berlebih</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Inventory Table */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      delay: 0.2
    }}>
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <span>Real-time Stock Levels</span>
                  {isFromApi ? <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-success" /> : <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monitor semua level stok produk secara real-time
                  {isFromApi ? ' (Live Data)' : ' (Local Data)'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {lastUpdated && <span className="text-xs text-muted-foreground hidden sm:inline">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>}
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="w-full sm:w-auto h-10">
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>
            {error && <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {error}
              </div>}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px] sm:min-w-[1000px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                    <TableRow>
                      <TableHead className="w-[160px] sm:w-[200px] p-2 sm:p-4">Produk</TableHead>
                      <TableHead className="w-[120px] sm:w-[140px] p-2 sm:p-4">Kategori</TableHead>
                      <TableHead className="w-[120px] sm:w-[140px] p-2 sm:p-4">Stok Saat Ini</TableHead>
                      <TableHead className="w-[100px] sm:w-[120px] p-2 sm:p-4">Status</TableHead>
                      <TableHead className="w-[100px] sm:w-[120px] p-2 sm:p-4">Level Stok</TableHead>
                      <TableHead className="w-[120px] sm:w-[140px] p-2 sm:p-4">Lokasi</TableHead>
                      <TableHead className="w-[100px] sm:w-[120px] p-2 sm:p-4">Nilai</TableHead>
                      <TableHead className="w-[80px] sm:w-[100px] p-2 sm:p-4">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewDetail(item)}>
                        <TableCell className="w-[160px] sm:w-[200px] p-2 sm:p-4">
                         <div className="space-y-1">
                            <div className="font-medium text-xs sm:text-sm line-clamp-1 leading-tight" title={item.name}>{item.name}</div>
                            <div className="text-xs text-muted-foreground truncate" title={item.sku}>{item.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[120px] sm:w-[140px] p-2 sm:p-4">
                          <div className="text-xs sm:text-sm truncate" title={item.category}>{item.category}</div>
                        </TableCell>
                        <TableCell className="w-[120px] sm:w-[140px] p-2 sm:p-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {getTrendIcon(item)}
                            <span className="font-medium text-xs sm:text-sm">{item.stock} {item.unit || 'pcs'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[100px] sm:w-[120px] p-2 sm:p-4">
                          <Badge className={`${getStatusColor(getProductStockStatus(item))} text-xs whitespace-nowrap`}>
                            {getStatusText(getProductStockStatus(item))}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[100px] sm:w-[120px] p-2 sm:p-4">
                          <div className="w-16 sm:w-24">
                            <Progress value={getStockPercentage(item)} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1" title={
                              item.maxStock && item.maxStock > 0 
                                ? `${item.stock}/${item.maxStock} (${getStockPercentage(item)}%)`
                                : item.minStock > 0
                                ? `Stock: ${item.stock}, Min: ${item.minStock} (${getStockPercentage(item)}%)`
                                : `Stock: ${item.stock} (${getStockPercentage(item)}%)`
                            }>
                              {getStockPercentage(item)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[120px] sm:w-[140px] p-2 sm:p-4">
                          <div className="text-xs sm:text-sm truncate" title={item.location}>{item.location}</div>
                        </TableCell>
                        <TableCell className="w-[100px] sm:w-[120px] p-2 sm:p-4">
                          <div className="text-xs sm:text-sm">
                            {item.price && item.stock ? `Rp ${(item.price * item.stock).toLocaleString('id-ID')}` : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="w-[80px] sm:w-[100px] p-2 sm:p-4">
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(item)} className="h-8 w-8 p-0">
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onStockAdjustment?.(item.id)} className="h-8 w-8 p-0">
                              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Detail Inventori
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Informasi lengkap produk inventori
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && <div className="space-y-4 sm:space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{selectedItem.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono">{selectedItem.sku || 'N/A'}</p>
                </div>
                <Badge className={`${getStatusColor(getProductStockStatus(selectedItem))} text-xs sm:text-sm px-2 sm:px-3 py-1 flex-shrink-0`}>
                  {getStatusText(getProductStockStatus(selectedItem))}
                </Badge>
              </div>

              {/* Basic Information */}
              <div className="border border-border rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  Informasi Produk
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategori</label>
                    <p className="text-xs sm:text-sm font-medium bg-background rounded px-2 py-1 border border-border">{selectedItem.category}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lokasi</label>
                    <p className="text-xs sm:text-sm font-medium bg-background rounded px-2 py-1 border border-border">{selectedItem.location}</p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="border border-border rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  Status Stok
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stok Saat Ini</label>
                    <p className="text-base sm:text-lg font-bold text-foreground bg-background rounded px-3 py-2 border border-border">
                      {selectedItem.stock || 0} {selectedItem.unit || 'pcs'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minimum</label>
                    <p className="text-xs sm:text-sm font-medium bg-background rounded px-3 py-2 border border-border">
                      {selectedItem.minStock || 0} {selectedItem.unit || 'pcs'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Maksimum</label>
                    <p className="text-xs sm:text-sm font-medium bg-background rounded px-3 py-2 border border-border">
                      {selectedItem.maxStock || 0} {selectedItem.unit || 'pcs'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Level Stok</label>
                  <div className="bg-background rounded p-3 border border-border">
                    <Progress value={getStockPercentage(selectedItem)} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {getStockPercentage(selectedItem)}% - {
                        selectedItem.maxStock && selectedItem.maxStock > 0 
                          ? `${selectedItem.stock}/${selectedItem.maxStock} (berdasarkan maxStock)`
                          : selectedItem.minStock > 0
                          ? `Relatif terhadap minStock (${selectedItem.minStock})`
                          : 'Berdasarkan estimasi kapasitas'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="border border-border rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  Informasi Keuangan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nilai Total</label>
                    <p className="text-base sm:text-lg font-bold text-primary bg-background rounded px-3 py-2 border border-border">
                      {selectedItem.price && selectedItem.stock ? `Rp ${(selectedItem.price * selectedItem.stock).toLocaleString('id-ID')}` : 'Tidak ada data'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Harga Satuan</label>
                    <p className="text-xs sm:text-sm font-medium bg-background rounded px-3 py-2 border border-border">
                      {selectedItem.price ? `Rp ${selectedItem.price.toLocaleString('id-ID')}` : 'Tidak ada data'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className="w-full sm:w-auto">
                  Tutup
                </Button>
                <Button onClick={() => {
              onStockAdjustment?.(selectedItem.id);
              setDetailDialogOpen(false);
             }} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  Atur Stok
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default InventoryOverview;
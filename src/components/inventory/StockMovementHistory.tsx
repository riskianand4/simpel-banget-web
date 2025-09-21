import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, ArrowRightLeft, Calendar, Search, Filter, Download, Edit, Trash2, Eye } from 'lucide-react';
import { getStockMovements, deleteStockMovement } from '@/services/stockMovementApi';
import { format, isValid } from 'date-fns';
import EditStockMovementModal from './EditStockMovementModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

// Helper function to safely format dates
const safeFormatDate = (date: any, formatString: string, fallback: string = 'Invalid Date') => {
  try {
    const dateObj = new Date(date);
    if (isValid(dateObj)) {
      return format(dateObj, formatString);
    }
    return fallback;
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
};

const StockMovementHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [movementDetail, setMovementDetail] = useState<any | null>(null);

  // Fetch movements from API
  const fetchMovements = async () => {
    setLoading(true);
    try {
      // Only fetch stock movements if authenticated and component is mounted
      if (!user) {
        logger.info('Skipping stock movements fetch - user not authenticated');
        return;
      }

      const data = await getStockMovements();
      setMovements(data);
    } catch (error) {
      logger.error('Failed to fetch stock movements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock movements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const getMovementStats = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekMovements = movements.filter(movement => {
      const movementDate = new Date(movement.createdAt);
      return isValid(movementDate) && movementDate >= lastWeek && movementDate <= today;
    });

    return {
      total: movements.length,
      thisWeek: weekMovements.length,
      inMovements: movements.filter(m => ['in', 'return'].includes(m.type)).length,
      outMovements: movements.filter(m => ['out', 'damage'].includes(m.type)).length,
    };
  };
  
  const stats = getMovementStats();

  const handleEdit = (movement: any) => {
    setSelectedMovement(movement);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (movementId: string) => {
    setMovementToDelete(movementId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (movementToDelete) {
      try {
        await deleteStockMovement(movementToDelete);
        setDeleteDialogOpen(false);
        setMovementToDelete(null);
        // Refresh movements
        fetchMovements();
        toast({
          title: "Success",
          description: "Stock movement deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete stock movement",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewDetail = (movement: any) => {
    setMovementDetail(movement);
    setDetailDialogOpen(true);
  };

  const handleUpdate = async (updatedMovement: any) => {
    try {
      // Update movement via API
      setEditModalOpen(false);
      setSelectedMovement(null);
      // Refresh movements
      fetchMovements();
      toast({
        title: "Success",
        description: "Stock movement updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock movement",
        variant: "destructive",
      });
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
      case 'return':
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case 'out':
      case 'damage':
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case 'adjustment':
      case 'count':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-purple-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const variants = {
      'in': 'bg-green-100 text-green-800 border-green-200',
      'return': 'bg-green-100 text-green-800 border-green-200',
      'out': 'bg-red-100 text-red-800 border-red-200',
      'damage': 'bg-red-100 text-red-800 border-red-200',
      'adjustment': 'bg-blue-100 text-blue-800 border-blue-200',
      'count': 'bg-blue-100 text-blue-800 border-blue-200',
      'transfer': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    return (
      <Badge className={variants[type] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const filteredMovements = movements.filter(movement => {
    const productName = movement.product?.name || '';
    const productSku = movement.product?.sku || '';
    
    const matchesSearch = 
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || movement.type === typeFilter.toLowerCase();
    
    let matchesDate = true;
    if (dateFilter !== 'ALL') {
      const movementDate = new Date(movement.createdAt);
      const now = new Date();
      
      if (isValid(movementDate)) {
        switch (dateFilter) {
          case 'TODAY':
            matchesDate = movementDate.toDateString() === now.toDateString();
            break;
          case 'WEEK':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = movementDate >= weekAgo;
            break;
          case 'MONTH':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = movementDate >= monthAgo;
            break;
        }
      } else {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const exportMovements = () => {
    // Implementation for exporting stock movements to Excel/CSV
    const exportData = filteredMovements.map(movement => ({
      'Product Name': movement.product?.name || '',
      'SKU': movement.product?.sku || '',
      'Type': movement.type,
      'Quantity': movement.quantity,
      'Previous Stock': movement.previousStock,
      'New Stock': movement.newStock,
      'Reason': movement.reason,
      'Reference': movement.reference || '',
      'Notes': movement.notes || '',
      'Date': safeFormatDate(movement.createdAt, 'yyyy-MM-dd HH:mm:ss'),
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {}).join(',');
    const rows = exportData.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-movements-${safeFormatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Movements</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock In</p>
                  <p className="text-2xl font-bold text-green-600">{stats.inMovements}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Out</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outMovements}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Stock Movement History
            </span>
            <Button onClick={exportMovements} size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by product name, code, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="IN">Stock In</SelectItem>
                <SelectItem value="OUT">Stock Out</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
                <SelectItem value="DAMAGE">Damage</SelectItem>
                <SelectItem value="COUNT">Count</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="WEEK">Last 7 Days</SelectItem>
                <SelectItem value="MONTH">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Movement Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Previous Stock</TableHead>
                  <TableHead>New Stock</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement, index) => (
                  <motion.tr
                    key={movement._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {safeFormatDate(movement.createdAt, 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{movement.product?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-muted-foreground">{movement.product?.sku || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        {getMovementBadge(movement.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={['out', 'damage'].includes(movement.type) ? 'text-red-600' : 'text-green-600'}>
                        {['out', 'damage'].includes(movement.type) ? '-' : '+'}{movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{movement.previousStock}</TableCell>
                    <TableCell className="font-medium">{movement.newStock}</TableCell>
                    <TableCell className="max-w-48 truncate">{movement.reason}</TableCell>
                    <TableCell>{movement.createdBy?.name || 'Unknown User'}</TableCell>
                    <TableCell>
                      {movement.location?.from?.warehouse || movement.location?.to?.warehouse || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetail(movement)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user?.role === 'superadmin' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(movement)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteClick(movement._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMovements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stock movements found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditStockMovementModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedMovement(null);
        }}
        movement={selectedMovement}
        onUpdate={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus transaksi stock movement ini? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Stock Movement</DialogTitle>
            <DialogDescription>
              Informasi lengkap transaksi stock movement
            </DialogDescription>
          </DialogHeader>
          {movementDetail && (
            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Informasi Transaksi
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tanggal & Waktu</label>
                    <p className="text-sm font-mono bg-background rounded px-2 py-1 border">
                      {safeFormatDate(movementDetail.createdAt, 'dd MMMM yyyy, HH:mm:ss')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipe Transaksi</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getMovementIcon(movementDetail.type)}
                      {getMovementBadge(movementDetail.type)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Product Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  Informasi Produk
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama Produk</label>
                    <p className="font-medium bg-background rounded px-2 py-1 border">{movementDetail.product?.name || 'Unknown Product'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kode Produk</label>
                    <p className="font-mono text-sm bg-background rounded px-2 py-1 border">{movementDetail.product?.sku || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Stock Movement Details */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Detail Pergerakan Stok
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jumlah</label>
                    <p className={`font-bold text-lg bg-background rounded px-2 py-1 border ${['out', 'damage'].includes(movementDetail.type) ? 'text-red-600' : 'text-green-600'}`}>
                      {['out', 'damage'].includes(movementDetail.type) ? '-' : '+'}{movementDetail.quantity}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock Sebelum</label>
                    <p className="font-medium bg-background rounded px-2 py-1 border">{movementDetail.previousStock}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock Sesudah</label>
                    <p className="font-medium bg-background rounded px-2 py-1 border">{movementDetail.newStock}</p>
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                  Informasi Tambahan
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lokasi</label>
                      <p className="bg-background rounded px-2 py-1 border">{movementDetail.location?.from?.warehouse || movementDetail.location?.to?.warehouse || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User</label>
                      <p className="bg-background rounded px-2 py-1 border">{movementDetail.createdBy?.name || 'Unknown User'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alasan</label>
                    <p className="bg-background rounded px-3 py-2 border min-h-[2.5rem] flex items-center">{movementDetail.reason}</p>
                  </div>
                  
                  {movementDetail.reference && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Referensi</label>
                      <p className="font-mono text-sm bg-background rounded px-2 py-1 border">{movementDetail.reference}</p>
                    </div>
                  )}
                  
                  {movementDetail.notes && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catatan</label>
                      <p className="text-sm bg-background rounded px-3 py-2 border min-h-[2.5rem] flex items-start">{movementDetail.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovementHistory;
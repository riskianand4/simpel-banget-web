import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, Upload, Download, RefreshCw, FileSpreadsheet, Plus } from 'lucide-react';
import { psbApi } from '@/services/psbApi';
import { PSBOrder, CreatePSBOrderRequest } from '@/types/psb';
import { toast } from 'sonner';
import { AdvancedFilters, FilterState } from './AdvancedFilters';
import { BulkOperations } from './BulkOperations';
import { VirtualizedDataTable } from './VirtualizedDataTable';
import { EnhancedPagination } from './EnhancedPagination';
import { PSBViewDialog } from './PSBViewDialog';
import { PSBEditDialog } from './PSBEditDialog';
import { PSBAddDialog } from './PSBAddDialog';
import { PSBDeleteDialog } from './PSBDeleteDialog';
import * as XLSX from 'xlsx';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface StatsInfo {
  filtered: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    clusters: number;
    stos: number;
    technicians: number;
  };
}

interface MetaInfo {
  availableClusters: string[];
  availableSTOs: string[];
  availableTechnicians: string[];
}

export const EnhancedDataManagement: React.FC = () => {
  // Data states
  const [orders, setOrders] = useState<PSBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<StatsInfo>({
    filtered: {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      clusters: 0,
      stos: 0,
      technicians: 0
    }
  });
  const [meta, setMeta] = useState<MetaInfo>({
    availableClusters: [],
    availableSTOs: [],
    availableTechnicians: []
  });

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    cluster: 'all',
    sto: 'all',
    technician: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Dialog states
  const [viewDialog, setViewDialog] = useState<{ open: boolean; order: PSBOrder | null }>({
    open: false,
    order: null
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; order: PSBOrder | null }>({
    open: false,
    order: null
  });
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; order: PSBOrder | null }>({
    open: false,
    order: null
  });

  // Debounced fetch function
  const fetchOrders = useCallback(async (resetPage = false) => {
    try {
      setLoading(true);
      
      const params: any = {
        page: resetPage ? 1 : pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      // Add filters
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.cluster && filters.cluster !== 'all') params.cluster = filters.cluster;
      if (filters.sto && filters.sto !== 'all') params.sto = filters.sto;
      if (filters.technician && filters.technician !== 'all') params.technician = filters.technician;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
      if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();

      const response = await psbApi.getOrders(params);
      
      if (response && response.success) {
        setOrders(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
        if (response.stats) {
          setStats(response.stats);
        }
        if (response.meta) {
          setMeta(response.meta);
        }
        
        // Clear selection after data change
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat data orders');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Debounced effect for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== '') {
        fetchOrders(true); // Reset to first page on search
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Effect for other filters (immediate)
  useEffect(() => {
    fetchOrders(true);
  }, [
    filters.status,
    filters.cluster,
    filters.sto,
    filters.technician,
    filters.dateFrom,
    filters.dateTo,
    filters.sortBy,
    filters.sortOrder,
    pagination.limit
  ]);

  // Effect for pagination
  useEffect(() => {
    if (pagination.page > 1) {
      fetchOrders();
    }
  }, [pagination.page]);

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      cluster: 'all',
      sto: 'all',
      technician: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Selection handlers
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  // Bulk operations
  const handleBulkUpdate = useCallback(async (ids: string[], updates: Partial<CreatePSBOrderRequest>) => {
    for (const id of ids) {
      await psbApi.updateOrder(id, updates);
    }
    fetchOrders();
  }, [fetchOrders]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await psbApi.deleteOrder(id);
    }
    fetchOrders();
  }, [fetchOrders]);

  // Dialog handlers
  const handleViewOrder = useCallback((order: PSBOrder) => {
    setViewDialog({ open: true, order });
  }, []);

  const handleEditOrder = useCallback((order: PSBOrder) => {
    setEditDialog({ open: true, order });
  }, []);

  const handleDeleteOrder = useCallback((order: PSBOrder) => {
    setDeleteDialog({ open: true, order });
  }, []);

  const handleAddOrder = useCallback(() => {
    setAddDialog(true);
  }, []);

  // CRUD operations
  const handleSaveEdit = useCallback(async (id: string, data: Partial<CreatePSBOrderRequest>) => {
    await psbApi.updateOrder(id, data);
    toast.success('Data berhasil diupdate');
    fetchOrders();
  }, [fetchOrders]);

  const handleSaveAdd = useCallback(async (data: CreatePSBOrderRequest) => {
    await psbApi.createOrder(data);
    toast.success('Data berhasil ditambahkan');
    fetchOrders();
  }, [fetchOrders]);

  const handleConfirmDelete = useCallback(async (id: string) => {
    await psbApi.deleteOrder(id);
    toast.success('Data berhasil dihapus');
    fetchOrders();
  }, [fetchOrders]);

  // Export function
  const handleExport = useCallback(() => {
    try {
      const exportData = orders.map(order => ({
        'No': order.no,
        'Order No': order.orderNo,
        'Date': new Date(order.date).toLocaleDateString('id-ID'),
        'Cluster': order.cluster,
        'STO': order.sto,
        'Customer Name': order.customerName,
        'Phone': order.customerPhone,
        'Address': order.address,
        'Package': order.package,
        'Status': order.status,
        'Technician': order.technician || '',
        'Notes': order.notes || '',
        'Created At': new Date(order.createdAt).toLocaleString('id-ID'),
        'Created By': order.createdBy.name
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'PSB Orders');

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `PSB_Orders_Export_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success(`Data berhasil diekspor ke ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    }
  }, [orders]);

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      title: 'Total Records',
      value: stats.filtered.total,
      icon: Database,
      color: 'primary'
    },
    {
      title: 'Completed',
      value: stats.filtered.completed,
      icon: Database,
      color: 'success'
    },
    {
      title: 'In Progress',
      value: stats.filtered.inProgress,
      icon: Database,
      color: 'warning'
    },
    {
      title: 'Pending',
      value: stats.filtered.pending,
      icon: Database,
      color: 'outline'
    }
  ], [stats]);

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Enhanced Data Management</h1>
          <p className="text-muted-foreground">
            Advanced PSB order management with filtering, bulk operations, and real-time updates
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => fetchOrders()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddOrder} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-4"
      >
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}/10 text-${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
        clusters={meta.availableClusters}
        stos={meta.availableSTOs}
        technicians={meta.availableTechnicians}
        isLoading={loading}
      />

      {/* Bulk Operations */}
      <BulkOperations
        orders={orders}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
      />

      {/* Data Table */}
      <VirtualizedDataTable
        orders={orders}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onView={handleViewOrder}
        onEdit={handleEditOrder}
        onDelete={handleDeleteOrder}
        height={600}
      />

      {/* Pagination */}
      <EnhancedPagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        isLoading={loading}
      />

      {/* Dialogs */}
      <PSBViewDialog
        open={viewDialog.open}
        order={viewDialog.order}
        onOpenChange={(open) => !open && setViewDialog({ open: false, order: null })}
      />

      <PSBEditDialog
        open={editDialog.open}
        order={editDialog.order}
        onOpenChange={(open) => !open && setEditDialog({ open: false, order: null })}
        onSave={handleSaveEdit}
      />

      <PSBAddDialog
        open={addDialog}
        onOpenChange={setAddDialog}
        onSave={handleSaveAdd}
      />

      <PSBDeleteDialog
        open={deleteDialog.open}
        order={deleteDialog.order}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, order: null })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
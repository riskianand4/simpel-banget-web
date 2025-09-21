import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Skeleton,
  StatsCardSkeleton,
  TableSkeleton,
} from "@/components/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  Package,
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePSBData } from "@/hooks/usePSBData";
import { PSBOrder } from "@/types/psb";
import { PSBOrderDetailModal } from "@/components/psb/PSBOrderDetailModal";
import { PSBEditOrderDialog } from "@/components/psb/PSBEditOrderDialog";
import { PSBDeleteOrderDialog } from "@/components/psb/PSBDeleteOrderDialog";
import { toast } from "sonner";

export const PSBCustomers: React.FC = () => {
  const {
    orders: customers,
    loading,
    error,
    fetchOrders,
    updateOrder,
    totalOrders,
    deleteOrder,
  } = usePSBData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clusterFilter, setClusterFilter] = useState("all");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<PSBOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setConnectionStatus("checking");
    try {
      await fetchOrders({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        cluster: clusterFilter !== "all" ? clusterFilter : undefined,
        limit: 100,
      });
      setConnectionStatus("connected");
    } catch (error) {
      setConnectionStatus("disconnected");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, clusterFilter]);

  const getStatusBadge = (status: string) => {
    const variants = {
      Completed: "default",
      "In Progress": "secondary",
      Pending: "outline",
      Cancelled: "destructive",
    };
    return variants[status as keyof typeof variants] || "outline";
  };

  const handleExport = () => {
    toast.success("Export data pelanggan akan segera dimulai");
  };

  const handleViewOrder = (order: PSBOrder) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleEditOrder = (order: PSBOrder) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleDeleteOrder = (order: PSBOrder) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateOrder = async (id: string, data: any) => {
    await updateOrder(id, data);
    await fetchCustomers(); // Refresh data
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteOrder(id);
    await fetchCustomers(); // Refresh data
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-56" />
            <Skeleton className="h-3 sm:h-4 w-72 sm:w-96" />
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Skeleton className="h-8 sm:h-9 w-20 sm:w-24" />
            <Skeleton className="h-8 sm:h-9 w-28 sm:w-32" />
            <Skeleton className="h-8 sm:h-9 w-32 sm:w-40" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({
            length: 4,
          }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Skeleton className="h-9 sm:h-10 w-full sm:flex-1 sm:min-w-[250px]" />
              <Skeleton className="h-9 sm:h-10 w-full sm:w-[180px]" />
              <Skeleton className="h-9 sm:h-10 w-full sm:w-[180px]" />
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
          </CardHeader>
          <CardContent className="pt-0">
            <TableSkeleton rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with fallback UI
  if (error && customers.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-6 max-w-full overflow-x-hidden">
        <Alert className="border-yellow-300 bg-primary/10">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                <strong>Backend PSB Service Tidak Tersedia</strong>
                <p className="text-xs sm:text-sm mt-1">
                  {error ||
                    "Data pelanggan tidak dapat dimuat. Backend mungkin tidak berjalan."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-xs capitalize">{connectionStatus}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="text-center py-8 sm:py-12">
          <Database className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
            Data Pelanggan Tidak Tersedia
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-sm sm:max-w-md mx-auto px-4">
            Backend server PSB mungkin tidak berjalan. Periksa apakah server
            berjalan di port 3001 dan endpoint /api/psb-orders dapat diakses.
          </p>
          <Button
            onClick={fetchCustomers}
            size="sm"
            className="w-full sm:w-auto sm:size-lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
        }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Data Pelanggan PSB
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base mt-1">
            Kelola dan monitor data pelanggan PSB secara komprehensif
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
          <Button
            onClick={fetchCustomers}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none min-w-0"
          >
            <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none min-w-0"
          >
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Export</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none min-w-0">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Tambah</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
          delay: 0.1,
        }}
      >
        <Card className="bg-card hover:bg-card-hover border-border transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Users className="h-4 sm:h-5 w-4 sm:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Total Pelanggan
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {totalOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-card-hover border-border transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-success rounded-lg flex items-center justify-center">
                <Package className="h-4 sm:h-5 w-4 sm:w-5 text-success-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Order Selesai
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {customers.filter((c) => c.status === "Completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-card-hover border-border transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-warning rounded-lg flex items-center justify-center">
                <RefreshCw className="h-4 sm:h-5 w-4 sm:w-5 text-warning-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Dalam Proses
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {customers.filter((c) => c.status === "In Progress").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-card-hover border-border transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-accent rounded-lg flex items-center justify-center">
                <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Total Cluster
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {new Set(customers.map((c) => c.cluster)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
          delay: 0.2,
        }}
      >
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 sm:h-5 w-4 sm:w-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, nomor order, atau telepon..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clusterFilter} onValueChange={setClusterFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Cluster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cluster</SelectItem>
                  {Array.from(new Set(customers.map((c) => c.cluster))).map(
                    (cluster) => (
                      <SelectItem key={cluster} value={cluster}>
                        {cluster}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Table */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
          delay: 0.3,
        }}
      >
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">
              Daftar Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {customers.map((customer, index) => (
                <motion.div
                  key={customer._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewOrder(customer)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">
                        {customer.customerName}
                      </h4>
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {customer.orderNo}
                      </code>
                    </div>
                    <Badge
                      variant={getStatusBadge(customer.status) as any}
                      className="text-xs"
                    >
                      {customer.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{customer.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {customer.sto} - {customer.cluster}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <Badge variant="outline" className="text-xs">
                          {customer.package}
                        </Badge>
                      </div>
                      <span className="text-xs ">
                        Teknisi: {customer.technician || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewOrder(customer)}
                      className="h-8 px-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditOrder(customer)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrder(customer)}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-lg border overflow-hidden max-w-[calc(100vw-10rem)] ">
              <div className="overflow-x-auto overflow-y-auto ">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-xs sm:text-sm w-12 min-w-12">
                        No
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm w-28 min-w-28">
                        Order ID
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm w-40 min-w-40">
                        Pelanggan
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm w-28 min-w-28">
                        Kontak
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm w-20 min-w-20">
                        Lokasi
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm w-24 min-w-24">
                        Paket
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm w-20 min-w-20">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm w-28 min-w-28">
                        Teknisi
                      </TableHead>
                      <TableHead className="font-semibold text-center text-xs sm:text-sm w-20 min-w-20">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer, index) => (
                      <motion.tr
                        key={customer._id}
                        initial={{
                          opacity: 0,
                          x: -20,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleViewOrder(customer)}
                      >
                        <TableCell className="font-medium text-xs sm:text-sm w-12 min-w-12">
                          <span className="truncate block">{customer.no}</span>
                        </TableCell>
                        <TableCell className="w-28 min-w-28">
                          <code className="bg-muted px-2 py-1 rounded text-xs block truncate max-w-28">
                            {customer.orderNo}
                          </code>
                        </TableCell>
                        <TableCell className="w-40 min-w-40">
                          <div>
                            <p className="font-medium text-xs sm:text-sm truncate">
                              {customer.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {customer.cluster}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="w-28 min-w-28">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">
                              {customer.customerPhone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-20 min-w-20">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">
                              {customer.sto}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-24 min-w-24">
                          <Badge
                            variant="outline"
                            className="text-xs truncate max-w-24 block"
                          >
                            <span className="truncate">{customer.package}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="w-20 min-w-20">
                          <Badge
                            variant={getStatusBadge(customer.status) as any}
                            className="text-xs truncate max-w-20 block"
                          >
                            <span className="truncate">{customer.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="w-28 min-w-28">
                          <span className="text-xs sm:text-sm truncate block">
                            {customer.technician || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="w-20 min-w-20">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(customer)}
                              title="Lihat Detail"
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOrder(customer)}
                              title="Edit Order"
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Edit className="h-3 sm:h-4 w-3 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOrder(customer)}
                              title="Hapus Order"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive flex-shrink-0"
                            >
                              <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {customers.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <Users className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  Tidak ada data pelanggan
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <PSBOrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
      />

      <PSBEditOrderDialog
        order={selectedOrder}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOrder(null);
        }}
        onUpdate={handleUpdateOrder}
      />

      <PSBDeleteOrderDialog
        order={selectedOrder}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedOrder(null);
        }}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
};

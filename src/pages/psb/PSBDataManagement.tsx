import React, { useState, useEffect, useRef } from "react";
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
import {
  Database,
  Upload,
  Download,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Info,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { psbApi } from "@/services/psbApi";
import { PSBOrder, CreatePSBOrderRequest } from "@/types/psb";
import { toast } from "sonner";
import { PSBViewDialog } from "@/components/psb/PSBViewDialog";
import { PSBEditDialog } from "@/components/psb/PSBEditDialog";
import { PSBAddDialog } from "@/components/psb/PSBAddDialog";
import { PSBDeleteDialog } from "@/components/psb/PSBDeleteDialog";
import * as XLSX from "xlsx";

export const PSBDataManagement: React.FC = () => {
  const [orders, setOrders] = useState<PSBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    order: PSBOrder | null;
  }>({
    open: false,
    order: null,
  });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    order: PSBOrder | null;
  }>({
    open: false,
    order: null,
  });
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    order: PSBOrder | null;
  }>({
    open: false,
    order: null,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await psbApi.getOrders({
        search,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 100,
      });
      if (response && response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Gagal memuat data orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        setSelectedFile(file);
        toast.success(`File ${file.name} siap untuk diimport`);
      } else {
        toast.error(
          "Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)"
        );
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }

    try {
      setImporting(true);

      // Read Excel file
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log("Parsed Excel data:", jsonData);

          // Transform Excel data to PSB format
          const orders = jsonData.map((row: any, index) => ({
            cluster: row["Cluster"] || row["cluster"] || "",
            sto: row["STO"] || row["sto"] || "",
            orderNo:
              row["Order No"] ||
              row["orderNo"] ||
              `ORDER-${Date.now()}-${index}`,
            customerName: row["Customer Name"] || row["customerName"] || "",
            customerPhone: row["Phone"] || row["customerPhone"] || "",
            address: row["Address"] || row["address"] || "",
            package: row["Package"] || row["package"] || "",
            status: row["Status"] || row["status"] || "Pending",
            technician: row["Technician"] || row["technician"] || "",
            notes: row["Notes"] || row["notes"] || "",
          }));

          // Create orders via API
          for (const order of orders) {
            try {
              await psbApi.createOrder(order);
            } catch (error) {
              console.error("Error creating order:", error);
            }
          }

          toast.success(
            `Berhasil mengimport ${orders.length} data dari ${selectedFile.name}`
          );
        } catch (parseError) {
          console.error("Error parsing Excel:", parseError);
          toast.error("Format Excel tidak valid");
        }
      };

      fileReader.readAsBinaryString(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh data after import
      setTimeout(() => fetchOrders(), 1500);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Gagal mengimport data");
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = orders.map((order) => ({
        No: order.no,
        "Order No": order.orderNo,
        Date: new Date(order.date).toLocaleDateString("id-ID"),
        Cluster: order.cluster,
        STO: order.sto,
        "Customer Name": order.customerName,
        Phone: order.customerPhone,
        Address: order.address,
        Package: order.package,
        Status: order.status,
        Technician: order.technician || "",
        Notes: order.notes || "",
        "Created At": new Date(order.createdAt).toLocaleString("id-ID"),
        "Created By": order.createdBy.name,
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PSB Orders");

      // Set column widths
      const colWidths = [
        { wch: 8 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 30 },
        { wch: 20 },
        { wch: 12 },
        { wch: 15 },
        { wch: 25 },
        { wch: 18 },
        { wch: 15 },
      ];
      ws["!cols"] = colWidths;

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `PSB_Orders_Export_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      toast.success(`Data berhasil diekspor ke ${filename}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data");
    }
  };

  // Dialog handlers
  const handleViewOrder = (order: PSBOrder) => {
    setViewDialog({ open: true, order });
  };

  const handleEditOrder = (order: PSBOrder) => {
    setEditDialog({ open: true, order });
  };

  const handleDeleteOrder = (order: PSBOrder) => {
    setDeleteDialog({ open: true, order });
  };

  const handleAddOrder = () => {
    setAddDialog(true);
  };

  // API operations
  const handleSaveEdit = async (
    id: string,
    data: Partial<CreatePSBOrderRequest>
  ) => {
    try {
      await psbApi.updateOrder(id, data);
      toast.success("Data berhasil diupdate");
      fetchOrders();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Gagal mengupdate data");
      throw error;
    }
  };

  const handleSaveAdd = async (data: CreatePSBOrderRequest) => {
    try {
      await psbApi.createOrder(data);
      toast.success("Data berhasil ditambahkan");
      setAddDialog(false); // Close the dialog
      fetchOrders();
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Gagal menambahkan data");
      throw error;
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await psbApi.deleteOrder(id);
      toast.success("Data berhasil dihapus");
      fetchOrders();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Gagal menghapus data");
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Completed: "default",
      "In Progress": "secondary",
      Pending: "outline",
      Cancelled: "destructive",
    };
    return variants[status as keyof typeof variants] || "outline";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "In Progress":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "Pending":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Skeleton className="h-9 w-full sm:w-24" />
            <Skeleton className="h-9 w-full sm:w-32" />
            <Skeleton className="h-9 w-full sm:w-36" />
          </div>
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1 min-w-0" />
              <Skeleton className="h-10 w-full sm:w-[180px]" />
            </div>
          </CardContent>
        </Card>

        {/* Data Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={10} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            PSB Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Kelola dan analisis data PSB secara menyeluruh
          </p>
        </div>
        <div className="flex flex-row sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={fetchOrders}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import Excel</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">
                  Import Data dari Excel
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Upload file Excel (.xlsx atau .xls) untuk mengimport data PSB
                  secara batch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center">
                  <FileSpreadsheet className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 sm:mb-4" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File Excel
                  </Button>
                  {selectedFile && (
                    <p className="text-xs sm:text-sm text-muted-foreground break-all">
                      File terpilih: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || importing}
                    className="flex-1 text-xs sm:text-sm"
                    size="sm"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Mengimport...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="glass hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Records
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {orders.length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {orders.filter((o) => o.status === "Completed").length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 text-success rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  In Progress
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {orders.filter((o) => o.status === "In Progress").length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 text-warning rounded-xl flex items-center justify-center">
                <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Clusters
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {new Set(orders.map((o) => o.cluster)).size}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filter & Pencarian Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama, order ID, atau nomor telepon..."
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                Data PSB Management
              </span>
              <Badge variant="outline" className="w-fit">
                {orders.length} records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                        No
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                        Order ID
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                        Customer
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">
                        Cluster
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">
                        STO
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">
                        Package
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">
                        Address
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">
                        Technician
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm text-center whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, index) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className="hover:bg-muted/50 transition-all duration-200"
                      >
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {order.no}
                        </TableCell>
                        <TableCell className="min-w-0">
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono block truncate max-w-[100px] sm:max-w-none">
                            {order.orderNo}
                          </code>
                        </TableCell>
                        <TableCell className="min-w-0">
                          <div>
                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                              {order.customerPhone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {order.cluster}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs sm:text-sm">
                            {order.sto}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs sm:text-sm truncate max-w-[100px]">
                            {order.package}
                          </span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-xs sm:text-sm truncate max-w-[150px]" title={order.address}>
                            {order.address}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <Badge
                              variant={getStatusBadge(order.status) as any}
                              className="text-xs"
                            >
                              <span className="hidden sm:inline">
                                {order.status}
                              </span>
                              <span className="sm:hidden">
                                {order.status.charAt(0)}
                              </span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs sm:text-sm">
                            {order.technician || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(order)}
                              className="hover:bg-blue-100 hover:text-blue-600 h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                              className="hover:bg-green-100 hover:text-green-600 h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOrder(order)}
                              className="hover:bg-red-100 hover:text-red-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12">
                <Database className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                  Tidak ada data
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Import data Excel atau tambah data manual untuk memulai
                </p>
                <Button className="mt-4" size="sm" onClick={handleAddOrder}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <PSBViewDialog
        open={viewDialog.open}
        onOpenChange={(open) => setViewDialog({ open, order: null })}
        order={viewDialog.order}
      />

      <PSBEditDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, order: null })}
        order={editDialog.order}
        onSave={handleSaveEdit}
      />

      <PSBAddDialog
        open={addDialog}
        onOpenChange={setAddDialog}
        onSave={handleSaveAdd}
      />

      <PSBDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, order: null })}
        order={deleteDialog.order}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

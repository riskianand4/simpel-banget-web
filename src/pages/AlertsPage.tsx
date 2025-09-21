import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import ModernLoginPage from "@/components/auth/ModernLoginPage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { safeToDate, safeLocaleDateString } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  Bell,
  BellOff,
  Eye,
  Edit,
  Trash2,
  Filter,
  Settings,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useOptimizedAlerts } from "@/hooks/useOptimizedAlerts";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import OptimizedAutomatedStockAlerts from "@/components/alerts/OptimizedAutomatedStockAlerts";
// Removed OptimizedAutoAlertMonitor import - using global instance from App.tsx
import {
  createStockAlert,
  acknowledgeStockAlert,
} from "@/services/stockMovementApi";
import { InventoryApiService } from "@/services/inventoryApi";
import { alertApiService } from "@/services/alertApi";
export default function AlertsPage() {
  const { user, isAuthenticated } = useApp();
  const { alerts: unifiedAlerts, acknowledgeAlert } = useOptimizedAlerts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Alert form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const inventoryApi = new InventoryApiService();
  const [formData, setFormData] = useState({
    type: "",
    severity: "MEDIUM",
    title: "",
    message: "",
    productId: "",
  });

  // Use unified alerts directly
  const allAlerts = unifiedAlerts.map((alert) => ({
    id: alert.id,
    type: alert.type.toLowerCase(),
    severity: alert.severity.toLowerCase(),
    title: `${alert.productName} Alert`,
    message: alert.message,
    timestamp: safeToDate(alert.timestamp),
    isRead: alert.acknowledged,
    isResolved: false,
    category: "inventory",
  }));
  const filteredAlerts = allAlerts.filter((alert) => {
    const matchesSearch =
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      selectedSeverity === "all" || alert.severity === selectedSeverity;
    const matchesType = selectedType === "all" || alert.type === selectedType;
    const matchesReadStatus = !showOnlyUnread || !alert.isRead;
    return matchesSearch && matchesSeverity && matchesType && matchesReadStatus;
  });
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "medium":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case "low_stock":
        return "bg-warning text-warning-foreground";
      case "out_of_stock":
        return "bg-destructive text-destructive-foreground";
      case "system":
        return "bg-primary text-primary-foreground";
      case "security":
        return "bg-destructive text-destructive-foreground";
      case "performance":
        return "bg-info text-info-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  const totalAlerts = allAlerts.length;
  const unreadAlerts = allAlerts.filter((alert) => !alert.isRead).length;
  const criticalAlerts = allAlerts.filter(
    (alert) => alert.severity === "critical"
  ).length;
  const resolvedAlerts = allAlerts.filter((alert) => alert.isResolved).length;

  // Map alert type to category
  const getAlertCategory = (type: string) => {
    switch (type) {
      case "SYSTEM":
        return "system_health";
      case "SECURITY":
        return "security";
      case "PERFORMANCE":
        return "performance";
      case "LOW_STOCK":
      case "OUT_OF_STOCK":
      case "OVERSTOCK":
      case "EXPIRING":
        return "inventory";
      default:
        return "system_health";
    }
  };

  // Load products when dialog opens and type is stock-related
  useEffect(() => {
    if (
      isCreateDialogOpen &&
      ["LOW_STOCK", "OUT_OF_STOCK", "OVERSTOCK", "EXPIRING"].includes(
        formData.type
      )
    ) {
      loadProducts();
    }
  }, [isCreateDialogOpen, formData.type]);
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await inventoryApi.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar produk",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle form submission
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is superadmin
    if (user?.role !== "superadmin") {
      toast({
        title: "Akses Ditolak",
        description: "Hanya superadmin yang dapat membuat custom alert",
        variant: "destructive",
      });
      return;
    }
    if (!formData.type || !formData.title || !formData.message) {
      toast({
        title: "Error",
        description: "Harap lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    // Check if product is required for stock alerts
    const isStockAlert = [
      "LOW_STOCK",
      "OUT_OF_STOCK",
      "OVERSTOCK",
      "EXPIRING",
    ].includes(formData.type);
    if (isStockAlert && !formData.productId) {
      toast({
        title: "Error",
        description: "Pilih produk untuk alert tipe stok",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const alertData = {
        type: formData.type.toUpperCase(),
        severity: formData.severity,
        title: formData.title,
        message: formData.message,
        category: getAlertCategory(formData.type),
        // Send as 'product' field for backend compatibility
        ...(isStockAlert && {
          product: formData.productId,
        }),
      };
      // Sending alert data
      await alertApiService.createAlert(alertData);
      toast({
        title: "Berhasil",
        description: "Alert berhasil dibuat",
        variant: "default",
      });

      // Reset form and close dialog
      setFormData({
        type: "",
        severity: "MEDIUM",
        title: "",
        message: "",
        productId: "",
      });
      setIsCreateDialogOpen(false);

      // No need to refresh as unified manager handles state updates automatically
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({
        title: "Error",
        description: "Gagal membuat alert. Periksa data dan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle acknowledge alert with unified manager
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      acknowledgeAlert(alertId);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast({
        title: "Error",
        description: "Gagal memproses alert",
        variant: "destructive",
      });
    }
  };
  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }
  return (
    <ErrorBoundary>
      <MainLayout>
        <div className=" sm:p-3 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <motion.div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
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
          >
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Alert Management
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Monitor dan kelola semua alert sistem
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {user?.role === "superadmin" && (
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Buat Alert</span>
                      <span className="sm:hidden">Buat</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">
                        Buat Alert Baru
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        Buat custom alert atau reminder
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAlert}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="alertType" className="text-sm">
                            Tipe Alert *
                          </Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                type: value,
                                productId: "",
                              })
                            }
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Pilih tipe alert" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SYSTEM">
                                System Alert
                              </SelectItem>
                              <SelectItem value="SECURITY">
                                Security Alert
                              </SelectItem>
                              <SelectItem value="PERFORMANCE">
                                Performance Alert
                              </SelectItem>
                              <SelectItem value="LOW_STOCK">
                                Low Stock Alert
                              </SelectItem>
                              <SelectItem value="OUT_OF_STOCK">
                                Out of Stock Alert
                              </SelectItem>
                              <SelectItem value="OVERSTOCK">
                                Overstock Alert
                              </SelectItem>
                              <SelectItem value="EXPIRING">
                                Expiring Alert
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {[
                            "LOW_STOCK",
                            "OUT_OF_STOCK",
                            "OVERSTOCK",
                            "EXPIRING",
                          ].includes(formData.type) && (
                            <p className="text-xs text-muted-foreground">
                              Untuk tipe stok, pilih produk di bawah.
                            </p>
                          )}
                        </div>
                        {/* Product Selection for Stock Alerts */}
                        {[
                          "LOW_STOCK",
                          "OUT_OF_STOCK",
                          "OVERSTOCK",
                          "EXPIRING",
                        ].includes(formData.type) && (
                          <div className="grid gap-2">
                            <Label htmlFor="productId" className="text-sm">
                              Produk *
                            </Label>
                            <Select
                              value={formData.productId}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  productId: value,
                                })
                              }
                              disabled={loadingProducts}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue
                                  placeholder={
                                    loadingProducts
                                      ? "Memuat produk..."
                                      : "Pilih produk"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id}
                                  >
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="severity" className="text-sm">
                            Severity
                          </Label>
                          <Select
                            value={formData.severity}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                severity: value,
                              })
                            }
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Pilih tingkat severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="title" className="text-sm">
                            Judul Alert *
                          </Label>
                          <Input
                            id="title"
                            placeholder="Masukkan judul alert"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            required
                            className="h-10"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="message" className="text-sm">
                            Pesan *
                          </Label>
                          <Textarea
                            id="message"
                            placeholder="Deskripsi detail alert..."
                            value={formData.message}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                message: e.target.value,
                              })
                            }
                            required
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto"
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto"
                        >
                          {isSubmitting ? "Membuat..." : "Buat Alert"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </motion.div>

          {/* Overview Cards */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
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
            <Card className="bg-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Alert
                </CardTitle>
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                  {totalAlerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total alert aktif
                </p>
              </CardContent>
            </Card>

            <Card className="bg-warning/10 border-warning/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Belum Dibaca
                </CardTitle>
                <BellOff className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-warning">
                  {unreadAlerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Alert belum dibaca
                </p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/10 border-destructive/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Kritikal
                </CardTitle>
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-destructive">
                  {criticalAlerts}
                </div>
                <p className="text-xs text-muted-foreground">Alert critical</p>
              </CardContent>
            </Card>

            <Card className="bg-success/10 border-success/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Diselesaikan
                </CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-success">
                  {resolvedAlerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Alert diselesaikan
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            className="space-y-3 sm:space-y-4"
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
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari alert berdasarkan judul atau pesan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 h-10 sm:h-12"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap gap-3 sm:gap-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full xl:w-48 h-10 sm:h-12">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedSeverity}
                onValueChange={setSelectedSeverity}
              >
                <SelectTrigger className="w-full xl:w-48 h-10 sm:h-12">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2 w-full xl:w-auto">
                <Switch
                  id="unread-only"
                  checked={showOnlyUnread}
                  onCheckedChange={setShowOnlyUnread}
                />
                <Label htmlFor="unread-only" className="text-xs sm:text-sm">
                  Belum dibaca saja
                </Label>
              </div>
            </div>
          </motion.div>

          {/* Main Content Tabs */}
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
            <Tabs defaultValue="alerts" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12">
                <TabsTrigger value="alerts" className="text-xs sm:text-sm">
                  Peringatan
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs sm:text-sm">
                  Pengaturan Notifikasi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="alerts" className="space-y-4">
                <OptimizedAutomatedStockAlerts />

                <Card>
                  <CardHeader className="p-3 sm:p-4 lg:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      Daftar Alert
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Alert sistem, stok, dan notifikasi lainnya
                      {filteredAlerts.length !== totalAlerts && (
                        <span className="ml-2 text-primary">
                          ({filteredAlerts.length} dari {totalAlerts} alert)
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[800px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px] sm:w-[100px]">
                              Status
                            </TableHead>
                            <TableHead className="w-[100px] sm:w-[120px]">
                              Tipe
                            </TableHead>
                            <TableHead className="w-[100px] sm:w-[120px]">
                              Severity
                            </TableHead>
                            <TableHead className="w-[150px] sm:w-[200px]">
                              Judul
                            </TableHead>
                            <TableHead className="w-[200px] sm:w-[250px]">
                              Pesan
                            </TableHead>
                            <TableHead className="w-[120px] sm:w-[150px]">
                              Waktu
                            </TableHead>
                            <TableHead className="w-[100px] sm:w-[120px]">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAlerts.map((alert) => (
                            <TableRow
                              key={alert.id}
                              className={!alert.isRead ? "bg-muted/30" : ""}
                            >
                              <TableCell className="p-2 sm:p-4">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  {!alert.isRead && (
                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                                  )}
                                  {alert.isResolved ? (
                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-success flex-shrink-0" />
                                  ) : (
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="p-2 sm:p-4">
                                <Badge
                                  className={`${getTypeColor(
                                    alert.type
                                  )} text-xs`}
                                >
                                  <span className="hidden sm:inline">
                                    {alert.type.replace("_", " ")}
                                  </span>
                                  <span className="sm:hidden">
                                    {alert.type.split("_")[0]}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell className="p-2 sm:p-4">
                                <Badge
                                  className={`${getSeverityColor(
                                    alert.severity
                                  )} text-xs`}
                                >
                                  <span className="hidden sm:inline">
                                    {alert.severity}
                                  </span>
                                  <span className="sm:hidden">
                                    {alert.severity.charAt(0)}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium p-2 sm:p-4">
                                <div
                                  className="text-xs sm:text-sm truncate"
                                  title={alert.title || `${alert.type} Alert`}
                                >
                                  {alert.title || `${alert.type} Alert`}
                                </div>
                              </TableCell>
                              <TableCell className="p-2 sm:p-4">
                                <div
                                  className="text-xs sm:text-sm truncate"
                                  title={alert.message}
                                >
                                  {alert.message}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm text-muted-foreground p-2 sm:p-4">
                                <div className="truncate">
                                  {safeLocaleDateString(
                                    alert.timestamp,
                                    "id-ID",
                                    undefined,
                                    "Unknown date"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="p-2 sm:p-4">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "Detail Alert",
                                        description: alert.message,
                                        variant: "default",
                                      });
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  {!alert.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleAcknowledgeAlert(alert.id)
                                      }
                                      className="h-8 w-8 p-0"
                                    >
                                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  )}
                                   {user?.role === "superadmin" &&
                                    !alert.isResolved && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          // Mark alert as resolved - implement this later
                                          toast({
                                            title: "Info",
                                            description:
                                              "Fitur resolve alert akan segera tersedia",
                                            variant: "default",
                                          });
                                        }}
                                        className="h-8 w-8 p-0"
                                      >
                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                                      </Button>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader className="p-3 sm:p-4 lg:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      Pengaturan Notifikasi
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Atur preferensi notifikasi untuk berbagai jenis alert
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm">
                        Pengaturan notifikasi akan tersedia setelah backend
                        notification system diimplementasikan
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
}

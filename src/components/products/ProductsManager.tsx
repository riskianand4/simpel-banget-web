import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { createComponentLogger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "./ProductCard";
import ProductTable from "./ProductTable";
import AddProductDialog from "./AddProductDialog";
import ProductsPageHeader from "./ProductsPageHeader";
import {
  filterProductsByStockStatus,
  getStockStatusCounts,
} from "@/utils/productStatusHelpers";
import ProductDetailModal from "@/components/dashboard/ProductDetailModal";
import ProductFilters from "./ProductFilters";
import BulkOperationDialog from "@/components/bulk/BulkOperationDialog";
import { ImportProductDialog } from "./ImportProductDialog";
import { useEnhancedProductManager } from "@/hooks/useEnhancedProductManager";
import { useApp } from "@/contexts/AppContext";
import { Product } from "@/types/inventory";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import * as XLSX from "xlsx";
export type SortOption = "name" | "price" | "stock" | "category" | "updated";
const ProductsManager = () => {
  const logger = useMemo(() => createComponentLogger("ProductsManager"), []);
  const { user } = useApp();
  const isAdmin = user?.role === "superadmin";
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [showFilters, setShowFilters] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Use enhanced product manager hook for API data
  const {
    products,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
  } = useEnhancedProductManager();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["all", ...cats];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return b.price - a.price;
        case "stock":
          return b.stock - a.stock;
        case "category":
          return a.category.localeCompare(b.category);
        case "updated":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        default:
          return 0;
      }
    });
    return filtered;
  }, [products, searchQuery, categoryFilter, statusFilter, sortBy]);
  const handleBulkAction = (action: string) => {
    if (selectedProducts.length === 0) return;
    switch (action) {
      case "export": {
        const selectedData = products.filter((p) =>
          selectedProducts.includes(p.id)
        );
        exportToExcel(
          selectedData,
          `Produk_Terpilih_${new Date().toISOString().split("T")[0]}.xlsx`
        );
        setSelectedProducts([]);
        break;
      }
      default: {
        setIsBulkDialogOpen(true);
        break;
      }
    }
  };
  const exportToExcel = (data: Product[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((product) => ({
        SKU: product.sku,
        "Nama Produk": product.name,
        Kategori: product.category,
        Harga: product.price,
        Stok: product.stock,
        "Stok Minimum": product.minStock,
        Status: product.status,
        Lokasi: product.location || "-",
        Supplier: product.supplier || "-",
        "Terakhir Update": new Date(product.updatedAt).toLocaleDateString(
          "id-ID"
        ),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produk");
    XLSX.writeFile(workbook, filename);
  };
  const handleExport = () => {
    exportToExcel(
      filteredProducts,
      `Semua_Produk_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };
  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleImportProducts = async (
    products: Omit<Product, "id" | "createdAt" | "updatedAt">[]
  ) => {
    try {
      let successCount = 0;

      for (const productData of products) {
        try {
          const success = await addProduct(productData);
          if (success) {
            successCount++;
          }
        } catch (error) {
          logger.error("Failed to import product:", error);
          
          // Store failed products for better error reporting
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('SKU already exists') || errorMessage.includes('DUPLICATE_SKU')) {
            logger.warn(`SKU conflict for product: ${productData.name} (${productData.sku})`);
          }
        }
      }

      if (successCount > 0) {
        await refreshProducts();
        logger.info(
          `Successfully imported ${successCount}/${products.length} products`
        );
      }
    } catch (error) {
      logger.error("Import process error:", error);
      throw error;
    }
  };
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalMode("view");
    setIsDetailModalOpen(true);
  };
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalMode("edit");
    setIsDetailModalOpen(true);
  };

  const stats = useMemo(() => {
    const stockCounts = getStockStatusCounts(products);
    return {
      total: products.length,
      inStock: stockCounts.inStock,
      lowStock: stockCounts.lowStock,
      outOfStock: stockCounts.outOfStock,
      totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    };
  }, [products]);
  const statItems = [
    {
      label: "Total Produk",
      value: stats.total,
      color: "text-blue-600",
    },
    {
      label: "Stok Tersedia",
      value: stats.inStock,
      color: "text-green-600",
    },
    {
      label: "Stok Menipis",
      value: stats.lowStock,
      color: "text-yellow-600",
    },
    {
      label: "Stok Habis",
      value: stats.outOfStock,
      color: "text-red-600",
    },
    {
      label: "Nilai Total",
      value: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(stats.totalValue),
      color: "text-purple-600",
    },
  ];
  return (
    <div className="min-h-screen  sm:px-4 lg:px-6 py-3 sm:py-4 pb-16 lg:py-6">
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="max-w-[1195px] mx-auto space-y-3 sm:space-y-4 lg:space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={handleImport}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 sm:ml-2">Import</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 sm:ml-2">Export</span>
                </Button>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 sm:ml-2">Tambah</span>
                </Button>
              </>
            )}
            {!isAdmin && (
              <Button
                variant="outline"
                onClick={handleExport}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="ml-1 sm:ml-2">Export</span>
              </Button>
            )}
          </div>
        </div>

        {/* Page Header with Stats */}
        <ProductsPageHeader
          totalProducts={stats.total}
          lowStockProducts={stats.lowStock}
          outOfStockProducts={stats.outOfStock}
          activeProducts={stats.inStock}
        />

        {/* Search and Filters */}
        <Card className="border ">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari produk, SKU, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              {/* Mobile Filter Toggle */}
              <div className="flex items-center justify-between sm:hidden">
                <p className="text-xs text-gray-600">
                  {filteredProducts.length} dari {products.length} produk
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Filter
                </Button>
              </div>

              {/* Filters - Collapsible on mobile */}
              <div
                className={`space-y-3 sm:space-y-0 sm:block ${
                  showFilters ? "block" : "hidden sm:block"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 lg:gap-3">
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-full lg:w-48 text-sm">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.slice(1).map((cat: string) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-40 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="in_stock">Tersedia</SelectItem>
                      <SelectItem value="low_stock">Stok Menipis</SelectItem>
                      <SelectItem value="out_of_stock">Stok Habis</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortBy}
                    onValueChange={(value: SortOption) => setSortBy(value)}
                  >
                    <SelectTrigger className="w-full lg:w-40 text-sm">
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nama</SelectItem>
                      <SelectItem value="price">Harga</SelectItem>
                      <SelectItem value="stock">Stok</SelectItem>
                      <SelectItem value="category">Kategori</SelectItem>
                      <SelectItem value="updated">Terakhir Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desktop Results info and Bulk actions */}
              <div className="hidden sm:flex sm:flex-col md:flex-row md:items-center md:justify-between gap-3">
                {selectedProducts.length > 0 && isAdmin && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedProducts.length} dipilih
                    </Badge>
                    <Select onValueChange={handleBulkAction}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Aksi Bulk" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border shadow-lg z-50">
                        <SelectItem value="bulk_operations">
                          Operasi Bulk
                        </SelectItem>
                        <SelectItem value="export">Export</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Bulk Actions */}
        {selectedProducts.length > 0 && isAdmin && (
          <div className="flex items-center justify-between gap-2 p-3 bg-blue-50 rounded-lg sm:hidden">
            <Badge variant="secondary" className="text-xs">
              {selectedProducts.length} dipilih
            </Badge>
            <Select onValueChange={handleBulkAction}>
              <SelectTrigger className="w-32 text-xs">
                <SelectValue placeholder="Aksi Bulk" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="bulk_operations">Operasi Bulk</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Products Table */}
        <Card className="glass">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={8} />
              </div>
            ) : (
              <>
                <div className="max-h-[calc(100vh)] overflow-x-auto overflow-y-auto">
                  <div className="min-w-[900px]">
                    <ProductTable
                      products={filteredProducts}
                      selectedProducts={isAdmin ? selectedProducts : []}
                      onSelectionChange={
                        isAdmin ? setSelectedProducts : () => {}
                      }
                      onView={handleViewProduct}
                      onEdit={isAdmin ? handleEditProduct : undefined}
                      onDelete={isAdmin ? deleteProduct : undefined}
                    />
                  </div>
                </div>

                {filteredProducts.length === 0 && !isLoading && (
                  <div className="p-1 sm:p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="sm:text-lg text-sm font-medium mb-2">
                      Tidak ada produk ditemukan
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      Coba ubah filter atau kata kunci pencarian Anda
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("all");
                        setStatusFilter("all");
                      }}
                      size="sm"
                    >
                      Reset Filter
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen && selectedProduct !== null}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdate={(updatedProduct) => {
          updateProduct(updatedProduct.id, updatedProduct);
          setIsDetailModalOpen(false);
        }}
      />

      <BulkOperationDialog
        open={isBulkDialogOpen}
        onOpenChange={(open) => {
          setIsBulkDialogOpen(open);
          if (!open) {
            setSelectedProducts([]);
          }
        }}
        selectedProductIds={selectedProducts}
        selectedProducts={products.filter((p) =>
          selectedProducts.includes(p.id)
        )}
      />

      <ImportProductDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportProducts}
      />
    </div>
  );
};
export default ProductsManager;

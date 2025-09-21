import React, { useState } from "react";
import { MoreVertical, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { Product } from "@/types/inventory";
import { getProductStockStatus } from "@/utils/productStatusHelpers";

interface ProductTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectionChange: (selected: string[]) => void;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => Promise<void> | void;
}

const ProductTable = ({
  products,
  selectedProducts,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
}: ProductTableProps) => {
  const { user } = useApp();
  const isAdmin = user?.role === "superadmin";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(products.map((p) => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProducts, productId]);
    } else {
      onSelectionChange(selectedProducts.filter((id) => id !== productId));
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "success";
      case "low_stock":
        return "warning";
      case "out_of_stock":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case "in_stock":
        return "Tersedia";
      case "low_stock":
        return "Stok Menipis";
      case "out_of_stock":
        return "Stok Habis";
      default:
        return "Tidak Diketahui";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const displayText = (val: any): string => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && 'name' in val) return (val as any).name || '-';
    return '-';
  };

  const isAllSelected =
    products.length > 0 && selectedProducts.length === products.length;
  const isIndeterminate =
    selectedProducts.length > 0 && selectedProducts.length < products.length;

  const handleViewProduct = (product: Product) => {
    if (onView) {
      onView(product);
    } else {
      setProductDetail(product);
      setDetailDialogOpen(true);
    }
  };

  const handleEditProduct = (product: Product) => {
    onEdit?.(product);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete && onDelete) {
      try {
        await Promise.resolve(onDelete(productToDelete));
        // Remove from local selection if selected
        if (selectedProducts.includes(productToDelete.id)) {
          onSelectionChange(
            selectedProducts.filter((id) => id !== productToDelete.id)
          );
        }
      } catch (e) {
        // Error already handled upstream (toast shown)
      }
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  return (
    <>
      <div className="mobile-table-container">
        <Table className="mobile-table-wrapper">
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <TableRow>
              {isAdmin && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-[200px]">Produk</TableHead>
              <TableHead className="w-[160px]">SKU</TableHead>
              <TableHead className="w-[100px]">Kategori</TableHead>
              <TableHead className="w-[120px] text-right">Harga</TableHead>
              <TableHead className="w-[140px] text-right">Stok</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px]">Lokasi</TableHead>
              <TableHead className="w-[120px]">Supplier</TableHead>
              <TableHead className="w-[160px]">Update Terakhir</TableHead>
              <TableHead className="w-[80px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 11 : 10}
                  className="text-center py-8 text-muted-foreground"
                >
                  Tidak ada produk ditemukan
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isSelected = selectedProducts.includes(product.id);
                const stockStatus = getProductStockStatus(product);

                return (
                  <TableRow
                    key={product.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors h-[70px] ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleViewProduct(product)}
                  >
                    {isAdmin && (
                      <TableCell
                        className="w-[50px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectProduct(product.id, checked as boolean)
                          }
                        />
                      </TableCell>
                    )}

                    <TableCell className="w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">
                            {product.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-medium text-sm truncate"
                            title={product.name}
                          >
                            {product.name}
                          </p>
                          {product.description && (
                            <p
                              className="text-xs text-muted-foreground truncate"
                              title={product.description}
                            >
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="w-[160px] ">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate whitespace-nowrap ">
                        {product.sku}
                      </code>
                    </TableCell>

                    <TableCell className="w-[100px]">
                      <div
                        className="text-xs truncate"
                        title={displayText(product.category)}
                      >
                        {displayText(product.category)}
                      </div>
                    </TableCell>

                    <TableCell className="w-[120px] text-right">
                      <div className="text-sm font-medium truncate">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          notation: "compact",
                        }).format(product.price)}
                      </div>
                    </TableCell>

                    <TableCell className="w-[140px] ">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{product.stock}</span>
                          <span className="text-xs text-muted-foreground truncate whitespace-nowrap ">
                            min: {product.minStock}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="w-[100px]">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          stockStatus === "in_stock"
                            ? "bg-success/10 text-success border-success/20"
                            : stockStatus === "low_stock"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : stockStatus === "out_of_stock"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-muted text-muted-foreground border-muted/50"
                        }`}
                      >
                        {getStockStatusLabel(stockStatus)}
                      </Badge>
                    </TableCell>

                    <TableCell className="w-[120px]">
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={displayText(product.location)}
                      >
                        {displayText(product.location)}
                      </div>
                    </TableCell>

                    <TableCell className="w-[120px]">
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={displayText(product.supplier)}
                      >
                        {displayText(product.supplier)}
                      </div>
                    </TableCell>

                    <TableCell className="w-[160px]">
                      <div className="text-xs text-muted-foreground truncate whitespace-nowrap">
                        {new Date(product.updatedAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="w-[80px] text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-background border-border shadow-lg z-50"
                          >
                            <DropdownMenuItem
                              onClick={() => handleViewProduct(product)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            {isAdmin && onEdit && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(product)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Produk</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus produk "{productToDelete?.name}
              "? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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
            <DialogTitle>Detail Produk</DialogTitle>
            <DialogDescription>Informasi lengkap produk</DialogDescription>
          </DialogHeader>
          {productDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nama Produk
                  </label>
                  <p className="font-medium">{productDetail.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    SKU
                  </label>
                  <p className="font-mono text-sm">{productDetail.sku}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Kategori
                  </label>
                  <p>{displayText(productDetail.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status Stok
                  </label>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      getProductStockStatus(productDetail) === "in_stock"
                        ? "bg-success/10 text-success border-success/20"
                        : getProductStockStatus(productDetail) === "low_stock"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : getProductStockStatus(productDetail) ===
                          "out_of_stock"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-muted/50"
                    }`}
                  >
                    {getStockStatusLabel(getProductStockStatus(productDetail))}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Harga
                  </label>
                  <p className="font-bold">
                    {formatCurrency(productDetail.price)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Stok Saat Ini
                  </label>
                  <p className="font-medium">{productDetail.stock}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Minimum Stok
                  </label>
                  <p className="font-medium">{productDetail.minStock}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Lokasi
                  </label>
                  <p>{displayText(productDetail.location)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Supplier
                  </label>
                  <p>{displayText(productDetail.supplier)}</p>
                </div>
              </div>

              {productDetail.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Deskripsi
                  </label>
                  <p className="text-sm">{productDetail.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Terakhir Diupdate
                </label>
                <p className="text-sm">
                  {new Date(productDetail.updatedAt).toLocaleDateString(
                    "id-ID",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductTable;

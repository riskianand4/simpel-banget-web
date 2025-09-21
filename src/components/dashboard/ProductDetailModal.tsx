import React, { useState, useEffect } from 'react';
import { Product } from '@/types/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WAREHOUSE_LOCATIONS } from '@/data/constants';
import { 
  Package, 
  MapPin, 
  Building2, 
  DollarSign, 
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product>(product || {} as Product);

  // Update editedProduct when product changes
  useEffect(() => {
    if (product) {
      setEditedProduct(product);
    }
  }, [product]);

  // Don't render if product is null
  if (!product) {
    return null;
  }

  const canEdit = user?.role === 'superadmin';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-success text-success-foreground';
      case 'low_stock': return 'bg-warning text-warning-foreground';
      case 'out_of_stock': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Stok Tersedia';
      case 'low_stock': return 'Stok Menipis';
      case 'out_of_stock': return 'Stok Habis';
      default: return status;
    }
  };

  // Get current stock status from product
  const currentStockStatus = product?.stockStatus || 
    (product?.stock === 0 ? 'out_of_stock' : 
     (product?.stock || 0) <= (product?.minStock || 0) ? 'low_stock' : 'in_stock');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const handleSave = () => {
    // Status will be automatically calculated by backend based on stock levels
    const updatedProduct = {
      ...editedProduct,
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updatedProduct);
    setIsEditing(false);
    toast({
      title: "Produk diperbarui",
      description: `${updatedProduct.name} berhasil diperbarui`,
    });
  };

  const handleCancel = () => {
    setEditedProduct(product);
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span>Detail Produk</span>
            </div>
            {canEdit && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-success hover:bg-success/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Simpan
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex-1">
              {isEditing ? (
                 <div className="space-y-2">
                   <Label htmlFor="name" className="text-xs sm:text-sm">Nama Produk</Label>
                  <Input
                    id="name"
                    value={editedProduct.name}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              ) : (
                 <>
                   <h2 className="text-lg font-semibold text-foreground">{product?.name || 'Unknown Product'}</h2>
                   <p className="text-sm text-muted-foreground font-mono mt-1">{product?.sku || 'N/A'}</p>
                 </>
               )}
             </div>
             <Badge className={`${getStatusColor(currentStockStatus)} ml-4 text-sm px-3 py-1`}>
               {getStatusLabel(currentStockStatus)}
             </Badge>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Information */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
                <Package className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                Informasi Stok
              </h3>
              
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stok Saat Ini</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={editedProduct.stock}
                        onChange={(e) => setEditedProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minimum Stok</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={editedProduct.minStock}
                        onChange={(e) => setEditedProduct(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                        className="bg-background border-border"
                      />
                    </div>
                  </>
                ) : (
                  <>
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stok Saat Ini</label>
                       <p className="text-sm font-semibold bg-background rounded px-3 py-2 border border-border">{product?.stock || 0} unit</p>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minimum Stok</label>
                       <p className="text-sm font-medium bg-background rounded px-3 py-2 border border-border">{product?.minStock || 0} unit</p>
                     </div>
                  </>
                )}
                
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategori</label>
                    <p className="text-sm font-medium bg-background rounded px-3 py-2 border border-border">{product?.category || 'N/A'}</p>
                  </div>
              </div>
            </div>

            {/* Price & Location */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                Harga & Lokasi
              </h3>
              
              <div className="space-y-4">
                {isEditing ? (
                   <div className="space-y-2">
                     <Label htmlFor="price" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Harga</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editedProduct.price}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      className="bg-background border-border"
                    />
                  </div>
                ) : (
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Harga</label>
                     <p className="text-lg font-bold text-primary bg-background rounded px-3 py-2 border border-border">{formatPrice(product?.price || 0)}</p>
                   </div>
                )}
                
                {isEditing ? (
                   <div className="space-y-2">
                     <Label htmlFor="location" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lokasi</Label>
                    <Select 
                      value={editedProduct.location || ''} 
                      onValueChange={(value) => setEditedProduct(prev => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Pilih lokasi gudang" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
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
                  </div>
                ) : (
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lokasi</label>
                     <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                       <MapPin className="w-4 h-4 text-muted-foreground" />
                       <span className="text-sm font-medium">{product?.location || 'N/A'}</span>
                     </div>
                   </div>
                )}
                
                {product?.supplier && (
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supplier</label>
                     <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                       <Building2 className="w-4 h-4 text-muted-foreground" />
                       <span className="text-sm font-medium">{product.supplier}</span>
                     </div>
                   </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {(product?.description || isEditing) && (
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Deskripsi</h3>
              {isEditing ? (
                <Textarea
                  value={editedProduct.description || ''}
                  onChange={(e) => setEditedProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan deskripsi produk..."
                  rows={3}
                  className="bg-background border-border"
                />
               ) : (
                 <p className="text-sm text-muted-foreground bg-background rounded px-3 py-2 border border-border">{product?.description || 'Tidak ada deskripsi'}</p>
               )}
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Terakhir diperbarui: {formatDate(product?.updatedAt || new Date())}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              ID: {product?.id || 'N/A'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
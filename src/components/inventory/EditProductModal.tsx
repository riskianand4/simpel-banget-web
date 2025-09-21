import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  supplier?: string;
  status: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSave?: (productId: string, updatedProduct: Partial<Product>) => void;
}

const EditProductModal = ({ isOpen, onClose, product, onSave }: EditProductModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    minStock: 0,
    maxStock: 0,
    unit: '',
    location: '',
    supplier: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const categories = [
    'Elektronik',
    'Komputer & Aksesoris',
    'Network Equipment',
    'Kabel & Aksesoris',
    'Storage',
    'Audio Video',
    'Lainnya'
  ];

  const units = [
    'pcs',
    'unit',
    'box',
    'pack',
    'meter',
    'kg',
    'liter'
  ];

  const locations = [
    'Telnet Banda Aceh',
    'Telnet Meulaboh',
  ];

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        sku: product.sku || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price || 0,
        minStock: product.minStock || 0,
        maxStock: product.maxStock || 0,
        unit: product.unit || 'pcs',
        location: product.location || '',
        supplier: product.supplier || ''
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama produk wajib diisi';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Kode produk wajib diisi';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU wajib diisi';
    }
    if (!formData.category) {
      newErrors.category = 'Kategori wajib dipilih';
    }
    if (formData.price < 0) {
      newErrors.price = 'Harga tidak boleh negatif';
    }
    if (formData.minStock < 0) {
      newErrors.minStock = 'Stok minimum tidak boleh negatif';
    }
    if (formData.maxStock < formData.minStock) {
      newErrors.maxStock = 'Stok maksimum harus lebih besar dari stok minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Mohon periksa kembali data yang diisi",
        variant: "destructive",
      });
      return;
    }

    // Call the onSave callback with updated data
    onSave?.(product.id, formData);
        onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Edit Produk
          </DialogTitle>
          <DialogDescription>
            Ubah informasi produk yang dipilih
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Product Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Produk Saat Ini</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama:</span>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Stok:</span>
                  <p className="font-medium">{product.stock} {product.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama produk"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Kode Produk *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Masukkan kode produk"
                className={errors.code ? 'border-destructive' : ''}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Masukkan SKU"
                className={errors.sku ? 'border-destructive' : ''}
              />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>

            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Masukkan deskripsi produk..."
              rows={3}
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Stok Minimum</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.minStock ? 'border-destructive' : ''}
              />
              {errors.minStock && <p className="text-xs text-destructive">{errors.minStock}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStock">Stok Maksimum</Label>
              <Input
                id="maxStock"
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={(e) => handleInputChange('maxStock', parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.maxStock ? 'border-destructive' : ''}
              />
              {errors.maxStock && <p className="text-xs text-destructive">{errors.maxStock}</p>}
            </div>
          </div>

          {/* Unit and Location */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Nama supplier"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
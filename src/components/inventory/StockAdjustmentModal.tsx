import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/inventory';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSave?: (productId: string, newStock: number, reason: string) => Promise<void>;
}

const StockAdjustmentModal = ({ isOpen, onClose, product, onSave }: StockAdjustmentModalProps) => {
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const [newStock, setNewStock] = useState(product.stock);
  const { toast } = useToast();

  // Update newStock when stockAdjustment changes
  useEffect(() => {
    setNewStock(product.stock + stockAdjustment);
  }, [stockAdjustment, product.stock]);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setStockAdjustment(0);
      setReason('');
      setNewStock(product.stock);
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penyesuaian stok wajib diisi",
        variant: "destructive",
      });
      return;
    }

    if (newStock < 0) {
      toast({
        title: "Error", 
        description: "Stok tidak boleh negatif",
        variant: "destructive",
      });
      return;
    }

    await onSave?.(product.id, newStock, reason);
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'bg-destructive text-destructive-foreground';
    if (stock <= product.minStock) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const getStockStatusText = (stock: number) => {
    if (stock === 0) return 'Stok Habis';
    if (stock <= product.minStock) return 'Stok Rendah';
    return 'Stok Normal';
  };

  const productUnit = product.unit || 'pcs';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Penyesuaian Stok
          </DialogTitle>
          <DialogDescription>
            Sesuaikan stok untuk produk yang dipilih
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Product Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                <Badge className={getStockStatusColor(product.stock)}>
                  {getStockStatusText(product.stock)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stock Information */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Stok Saat Ini</p>
              <p className="text-xl font-bold">{product.stock}</p>
              <p className="text-xs text-muted-foreground">{productUnit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Penyesuaian</p>
              <p className={`text-xl font-bold ${stockAdjustment > 0 ? 'text-success' : stockAdjustment < 0 ? 'text-destructive' : ''}`}>
                {stockAdjustment > 0 ? '+' : ''}{stockAdjustment}
              </p>
              <p className="text-xs text-muted-foreground">{productUnit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Stok Baru</p>
              <p className="text-xl font-bold">{newStock}</p>
              <p className="text-xs text-muted-foreground">{productUnit}</p>
            </div>
          </div>

          {/* Stock Limits Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Stok Minimum</p>
              <p className="text-sm font-medium">{product.minStock} {productUnit}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Stok Maksimum</p>
              <p className="text-sm font-medium">{product.maxStock || 'Tidak terbatas'}</p>
            </div>
          </div>

          {/* Stock Adjustment Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment">Penyesuaian Stok</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setStockAdjustment(prev => prev - 1)}
                  disabled={newStock <= 0}
                >
                  <TrendingDown className="w-4 h-4" />
                </Button>
                <Input
                  id="adjustment"
                  type="number"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                  className="text-center"
                  placeholder="0"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setStockAdjustment(prev => prev + 1)}
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Masukkan angka positif untuk menambah stok, negatif untuk mengurangi stok
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Penyesuaian *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Masukkan alasan penyesuaian stok (wajib diisi)..."
                rows={3}
              />
            </div>
          </div>

          {/* New Stock Status Preview */}
          {stockAdjustment !== 0 && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status Stok Baru:</span>
                <Badge className={getStockStatusColor(newStock)}>
                  {getStockStatusText(newStock)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={stockAdjustment === 0 || !reason.trim()}
          >
            Simpan Penyesuaian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentModal;
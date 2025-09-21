import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedProductManager } from '@/hooks/useEnhancedProductManager';
import { createStockMovement } from '@/services/stockMovementApi';
import { Plus, Minus, RotateCcw, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WAREHOUSE_LOCATIONS } from '@/data/constants';
import { logger } from '@/utils/logger';

interface StockTransactionFormProps {
  onTransactionComplete?: () => void;
}

const StockTransactionForm = ({ onTransactionComplete }: StockTransactionFormProps) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [transactionType, setTransactionType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [location, setLocation] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { products, fetchProducts } = useEnhancedProductManager();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const selectedProductData = products.find(p => p.id === selectedProduct);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error", 
        description: "You must be logged in to create stock movements",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = products.find(p => p.id === selectedProduct);
      if (!productData) {
        toast({
          title: "Error",
          description: "Selected product not found",
          variant: "destructive",
        });
        return;
      }

      // Create movement data for API
      const movementData = {
        product: selectedProduct,
        type: transactionType,
        quantity: Math.abs(quantity),
        reason,
        reference: reference || undefined,
        cost: unitPrice > 0 ? unitPrice : undefined,
        supplier: supplier ? {
          name: supplier,
          contact: '',
          invoice: reference || ''
        } : undefined,
        location: location ? {
          from: { warehouse: location, shelf: '', bin: '' },
          to: { warehouse: location, shelf: '', bin: '' }
        } : undefined,
        notes: notes || undefined,
      };

      logger.debug('Creating stock movement', movementData);

      await createStockMovement(movementData);

      // Reset form
      setSelectedProduct('');
      setQuantity(0);
      setReason('');
      setReference('');
      setLocation('');
      setUnitPrice(0);
      setSupplier('');
      setNotes('');
      
      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });

      // Refresh products to get updated stock
      await fetchProducts();
      
      onTransactionComplete?.();

    } catch (error) {
      console.error('Failed to record transaction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record stock movement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'IN': return <Plus className="w-4 h-4" />;
      case 'OUT': return <Minus className="w-4 h-4" />;
      case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'IN': return 'bg-success/10 text-success border-success/20';
      case 'OUT': return 'bg-warning/10 text-warning border-warning/20';
      case 'ADJUSTMENT': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Input Transaksi Stok
        </CardTitle>
        <CardDescription>
          Catat pergerakan stok masuk, keluar, atau adjustment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {(['in', 'out', 'adjustment'] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={transactionType === type ? "default" : "outline"}
                onClick={() => setTransactionType(type)}
                className={transactionType === type ? getTransactionColor(type.toUpperCase()) : ''}
              >
                {getTransactionIcon(type.toUpperCase())}
                <span className="ml-2">
                  {type === 'in' ? 'Masuk' : type === 'out' ? 'Keluar' : 'Adjustment'}
                </span>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produk *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{product.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            Stock: {product.stock}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="space-y-2">
                <Label htmlFor="quantity">
                  {transactionType === 'adjustment' ? 'Stok Baru' : 'Jumlah'} *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder={transactionType === 'adjustment' ? 'Stok setelah adjustment' : '0'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Alasan *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionType === 'in' && (
                      <>
                        <SelectItem value="purchase">Pembelian</SelectItem>
                        <SelectItem value="return">Retur dari Customer</SelectItem>
                        <SelectItem value="transfer_in">Transfer Masuk</SelectItem>
                        <SelectItem value="adjustment_in">Adjustment Masuk</SelectItem>
                      </>
                    )}
                    {transactionType === 'out' && (
                      <>
                        <SelectItem value="sale">Penjualan</SelectItem>
                        <SelectItem value="return_supplier">Retur ke Supplier</SelectItem>
                        <SelectItem value="transfer_out">Transfer Keluar</SelectItem>
                        <SelectItem value="damage">Kerusakan</SelectItem>
                        <SelectItem value="lost">Kehilangan</SelectItem>
                      </>
                    )}
                    {transactionType === 'adjustment' && (
                      <>
                        <SelectItem value="stock_opname">Stock Opname</SelectItem>
                        <SelectItem value="correction">Koreksi</SelectItem>
                        <SelectItem value="initial_stock">Stok Awal</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokasi/Gudang *</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
                    {WAREHOUSE_LOCATIONS.map((loc) => (
                      <SelectItem 
                        key={loc} 
                        value={loc}
                        className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Referensi</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="No. PO, Invoice, Transfer, dll"
                />
              </div>

              {transactionType === 'in' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Harga Satuan</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="Nama supplier"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Current Stock Info */}
          {selectedProductData && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Stok Saat Ini</div>
                  <div className="font-semibold">{selectedProductData.stock}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {transactionType === 'adjustment' ? 'Perubahan' : 'Jumlah Transaksi'}
                  </div>
                  <div className="font-semibold">
                    {transactionType === 'out' ? '-' : ''}
                    {transactionType === 'adjustment' 
                      ? (quantity - selectedProductData.stock)
                      : quantity
                    }
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Stok Setelah</div>
                  <div className="font-semibold">
                    {transactionType === 'in' 
                      ? selectedProductData.stock + quantity
                      : transactionType === 'out'
                      ? selectedProductData.stock - quantity
                      : quantity
                    }
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Nilai</div>
                  <div className="font-semibold">
                    {unitPrice > 0 ? `Rp ${(quantity * unitPrice).toLocaleString('id-ID')}` : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setSelectedProduct('');
                setQuantity(0);
                setReason('');
                setReference('');
                setUnitPrice(0);
                setSupplier('');
                setNotes('');
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StockTransactionForm;
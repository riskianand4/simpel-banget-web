import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { Product } from '@/types/inventory';
import { getProductStockStatus } from '@/utils/productStatusHelpers';
import { bulkValidateProducts } from '@/utils/stockValidation';

interface StockAlertBannerProps {
  products: Product[];
  onDismiss?: () => void;
  onViewProduct?: (productId: string) => void;
}

export const StockAlertBanner: React.FC<StockAlertBannerProps> = ({
  products,
  onDismiss,
  onViewProduct
}) => {
  // Enhanced critical product detection
  const validationResults = bulkValidateProducts(products);
  
  const criticalProducts = products.filter(product => {
    const status = getProductStockStatus(product);
    return status === 'out_of_stock' || status === 'low_stock';
  });

  // Enhanced counting with edge case detection
  const outOfStockCount = criticalProducts.filter(p => getProductStockStatus(p) === 'out_of_stock').length;
  const lowStockCount = criticalProducts.filter(p => getProductStockStatus(p) === 'low_stock').length;
  const zeroMinStockCount = products.filter(p => p.minStock === 0 && p.stock <= 5).length;

  if (criticalProducts.length === 0) return null;

  return (
    <Alert className="border-warning bg-warning/10 mb-4">
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
      <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="font-medium text-warning">
            Peringatan Stok:
          </span>
          <div className="flex gap-2">
            {outOfStockCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {outOfStockCount} produk habis
              </Badge>
            )}
            {lowStockCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-warning text-warning-foreground">
                {lowStockCount} stok rendah
              </Badge>
            )}
            {zeroMinStockCount > 0 && (
              <Badge variant="outline" className="text-xs border-info text-info">
                {zeroMinStockCount} perlu setup threshold
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            Segera lakukan restock untuk menjaga ketersediaan.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onViewProduct && criticalProducts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProduct(criticalProducts[0].id)}
              className="text-xs"
            >
              Lihat Detail
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default StockAlertBanner;
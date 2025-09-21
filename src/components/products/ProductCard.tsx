import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Edit, Trash2, Eye, Package, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { Product } from '@/types/inventory';
import { getProductStockStatus } from '@/utils/productStatusHelpers';
interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}
const ProductCard = ({
  product,
  isSelected,
  onSelect,
  onView,
  onEdit
}: ProductCardProps) => {
  const {
    user
  } = useApp();
  const isAdmin = user?.role === 'superadmin';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'success';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'Tersedia';
      case 'low_stock':
        return 'Stok Menipis';
      case 'out_of_stock':
        return 'Stok Habis';
      default:
        return status;
    }
  };
  const stockPercentage = product.stock / (product.minStock * 3) * 100;
  return <div className="relative">
      <Card className="glass hover-lift border-border/50 overflow-hidden group cursor-pointer h-[400px] flex flex-col" onClick={() => onView?.(product)}>
        {/* Header with checkbox and menu */}
        

        {/* Product Image/Icon */}
        <div className="h-40 bg-primary/10 flex items-center justify-center relative overflow-hidden">
          {(product.image || (product.images && product.images.length > 0)) ? 
            <img 
              src={product.image || (product.images && product.images[0]) || ''} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              onError={e => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }} 
            /> : null}
          <div className={`flex items-center justify-center w-full h-full ${(product.image || (product.images && product.images.length > 0)) ? 'hidden' : ''}`}>
            <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
          </div>
        </div>

        <CardContent className="mobile-padding-compact space-y-2 md:space-y-3 flex flex-col">
          {/* Product Name and SKU */}
          <div className="min-h-[50px] md:min-h-[60px]">
            <h3 className="font-semibold mobile-text-small line-clamp-2 mb-1 leading-tight" title={product.name}>
              {product.name}
            </h3>
            <p className="mobile-text-tiny text-muted-foreground truncate" title={product.sku}>
              SKU: {product.sku}
            </p>
          </div>

          {/* Category and Status */}
          <div className="flex items-center justify-between gap-1 md:gap-2 min-h-[20px] md:min-h-[24px]">
            <Badge variant="outline" className="mobile-text-tiny truncate max-w-[100px] md:max-w-[120px]" title={product.category}>
              {product.category}
            </Badge>
            <Badge variant={getStatusColor(product.status) === 'success' ? 'default' : 'secondary'} className={`mobile-text-tiny whitespace-nowrap ${getStatusColor(product.status) === 'warning' ? 'bg-warning text-warning-foreground' : getStatusColor(product.status) === 'destructive' ? 'bg-destructive text-destructive-foreground' : ''}`}>
              {getStatusLabel(product.status)}
            </Badge>
          </div>

          {/* Price */}
          <div className="mobile-text-small md:text-sm font-bold text-primary">
            {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(product.price)}
          </div>

          {/* Stock Information */}
          <div className="space-y-1 md:space-y-2">
            <div className="flex justify-between mobile-text-tiny">
              <span className="text-muted-foreground">Stok:</span>
              <span className="font-medium">
                {product.stock} / min: {product.minStock}
              </span>
            </div>
            
            <Progress value={Math.min(stockPercentage, 100)} className="h-1 md:h-1.5" />
          </div>

          {/* Location and Last Updated */}
          

          {/* Supplier */}
          {product.supplier}

        </CardContent>

        {/* Stock Alert Indicator */}
        {getProductStockStatus(product) === 'low_stock' && <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-warning" />}
        {getProductStockStatus(product) === 'out_of_stock' && <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-destructive" />}
      </Card>
    </div>;
};
export default ProductCard;
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Boxes, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
interface ProductStatsProps {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  activeProducts: number;
}
const ProductsPageHeader = ({
  totalProducts,
  lowStockProducts,
  outOfStockProducts,
  activeProducts
}: ProductStatsProps) => {
  return <div className="space-y-6">
      

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.2
    }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Dalam katalog</p>
          </CardContent>
        </Card>

        <Card className="bg-success/10 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <Boxes className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">Tersedia</p>
          </CardContent>
        </Card>

        <Card className="bg-warning/10 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Perlu restock</p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Habis</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">Tidak tersedia</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>;
};
export default ProductsPageHeader;
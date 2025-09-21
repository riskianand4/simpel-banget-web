import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import MainLayout from '@/components/layout/MainLayout';
import InventoryOverview from '@/components/inventory/InventoryOverview';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { ProductProvider, useProducts } from '@/contexts/ProductContext';

const InventoryPageContent = () => {
  const { toast } = useToast();
  const { products, updateProduct, getProductById } = useProducts();
  
  const [stockAdjustmentModal, setStockAdjustmentModal] = useState<{
    isOpen: boolean;
    product: any;
  }>({
    isOpen: false,
    product: null
  });

  const handleStockAdjustment = (productId: string) => {
    const product = getProductById(productId);
    if (product) {
      setStockAdjustmentModal({
        isOpen: true,
        product
      });
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number, reason: string) => {
    const product = getProductById(productId);
    if (product) {
      const success = await updateProduct(productId, { stock: newStock });
      
      if (success) {
        toast({
          title: "Stok Berhasil Disesuaikan",
          description: `Stok ${product.name} diubah menjadi ${newStock} ${product.unit || 'pcs'}`,
        });
        setStockAdjustmentModal({ isOpen: false, product: null });
      }
    }
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className="pb-10">
          {/* Main Inventory Overview */}
          <InventoryOverview onStockAdjustment={handleStockAdjustment} />

          {/* Stock Adjustment Modal */}
          {stockAdjustmentModal.product && (
            <StockAdjustmentModal
              isOpen={stockAdjustmentModal.isOpen}
              onClose={() => setStockAdjustmentModal({ isOpen: false, product: null })}
              product={stockAdjustmentModal.product}
              onSave={handleStockUpdate}
            />
          )}
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

const InventoryPage = () => {
  const { user, isAuthenticated } = useApp();

  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  return (
    <ProductProvider>
      <InventoryPageContent />
    </ProductProvider>
  );
};

export default InventoryPage;
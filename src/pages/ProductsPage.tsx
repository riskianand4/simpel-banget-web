import React from 'react';
import { useApp } from '@/contexts/AppContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import MainLayout from '@/components/layout/MainLayout';
import ProductsManager from '@/components/products/ProductsManager';

const ProductsPage = () => {
  const { user, isAuthenticated } = useApp();

  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  return (
    <MainLayout>
      <ProductsManager />
    </MainLayout>
  );
};

export default ProductsPage;
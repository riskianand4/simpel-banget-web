import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/types/inventory';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { createComponentLogger } from '@/utils/logger';
import { errorHandler } from '@/services/errorHandler';

interface ProductContextState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  isFromApi: boolean;
  fetchProducts: (force?: boolean) => Promise<void>;
  addProduct: (productData: Partial<Product>) => Promise<boolean>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  refreshProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  isOnline: boolean;
  isAuthenticated: boolean;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

const ProductContext = createContext<ProductContextState | undefined>(undefined);

interface ProductProviderProps {
  children: React.ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const logger = useMemo(() => createComponentLogger('ProductProvider'), []);
  const { apiService, isAuthenticated, isOnline, user } = useApp();
  
  const [state, setState] = useState({
    products: [] as Product[],
    isLoading: true,
    error: null as string | null,
    isFromApi: false
  });

  // Load cached data on initialization
  useEffect(() => {
    const loadCachedProducts = () => {
      try {
        const cached = localStorage.getItem('products-cache');
        if (cached) {
          const cachedProducts = JSON.parse(cached);
          setState(prev => ({
            ...prev,
            products: cachedProducts,
            isLoading: false,
            isFromApi: false
          }));
          logger.info('Loaded cached products', { count: cachedProducts.length });
        }
      } catch (error) {
        logger.error('Failed to load cached products', error);
      }
    };

    loadCachedProducts();
  }, [logger]);

  // Fetch products from API
  const fetchProducts = useCallback(async (force = false): Promise<void> => {
    if (!isAuthenticated) {
      logger.warn('Not authenticated, cannot fetch products');
      setState(prev => ({ ...prev, isLoading: false, error: 'Authentication required' }));
      return;
    }

    // Enhanced connection check
    if (!isOnline && !force) {
      logger.info('Offline mode, using cached data');
      toast.info('Using cached data - offline mode');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.info('Fetching products from API');
      const response = await apiService.getProducts();
      
      if (response.success && Array.isArray(response.data)) {
        const products = response.data;
        
        // Cache the data
        localStorage.setItem('products-cache', JSON.stringify(products));
        localStorage.setItem('products-cache-timestamp', Date.now().toString());
        
        setState({
          products,
          isLoading: false,
          error: null,
          isFromApi: true
        });
        
        logger.info('Successfully loaded products from API', { count: products.length });
      } else {
        throw new Error(response.error || 'Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      logger.error('Failed to fetch products', error);
      
      // Enhanced error handling
      errorHandler.logError(error instanceof Error ? error : new Error(errorMessage), {
        component: 'ProductProvider',
        action: 'fetchProducts'
      }, 'high');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      // Only show toast if this isn't a background refresh
      if (force || state.products.length === 0) {
        toast.error(`Connection failed: ${errorMessage}`);
      }
    }
  }, [apiService, isAuthenticated, isOnline, logger, state.products.length]);

  // Auto-fetch with intelligent retry - reduce frequency
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      // Debounce rapid auth/online changes and reduce auto-refresh
      const timeoutId = setTimeout(() => {
        // Only fetch if we don't have data or it's been more than 5 minutes
        const lastFetch = localStorage.getItem('products-cache-timestamp');
        const shouldFetch = !state.products.length || !lastFetch || (Date.now() - parseInt(lastFetch)) > 300000;
        
        if (shouldFetch) {
          fetchProducts();
        }
      }, 1000); // Increased debounce time
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isOnline, state.products.length]); // Fixed dependency

  // Add product
  const addProduct = useCallback(async (productData: Partial<Product>): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to add products');
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiService.createProduct(productData);
      
      if (response.success) {
        await fetchProducts(true); // Refresh the list
        toast.success('Product added successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to create product');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add product';
      logger.error('Failed to add product', error);
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [apiService, isAuthenticated, fetchProducts, logger]);

  // Update product
  const updateProduct = useCallback(async (id: string, productData: Partial<Product>): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to update products');
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiService.updateProduct(id, productData);
      
      if (response.success) {
        await fetchProducts(true); // Refresh the list
        toast.success('Product updated successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to update product');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      logger.error('Failed to update product', error);
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [apiService, isAuthenticated, fetchProducts, logger]);

  // Delete product
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to delete products');
      return false;
    }

    if (user?.role !== 'superadmin') {
      toast.error('You do not have permission to delete products');
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiService.deleteProduct(id);
      
      if (response.success) {
        // Immediately remove from local state to provide instant feedback
        setState(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== id),
          isLoading: false
        }));
        
        // Update cache immediately
        const updatedProducts = state.products.filter(p => p.id !== id);
        localStorage.setItem('products-cache', JSON.stringify(updatedProducts));
        
        // Check if product was archived or deleted
        const responseData = response.data as any;
        const message = responseData?.message || '';
        if (message.includes('archived') || responseData?.archived) {
          toast.success('Produk Diarsipkan', {
            description: 'Produk telah dinonaktifkan karena memiliki riwayat stok'
          });
        } else {
          toast.success('Produk Dihapus', {
            description: 'Produk berhasil dihapus'
          });
        }
        
        // Refresh from server in background (but don't wait for it)
        setTimeout(() => fetchProducts(true), 100);
        return true;
      } else {
        const errorMessage = response.error || 'Failed to delete product';
        
        // Handle specific backend errors
        if (errorMessage.includes('stock movements') || errorMessage.includes('audit') || errorMessage.includes('cannot be deleted')) {
          toast.error('Tidak Dapat Menghapus Produk', {
            description: 'Produk ini memiliki riwayat pergerakan stok sehingga tidak dapat dihapus demi menjaga jejak audit. Pertimbangkan untuk menandainya sebagai tidak aktif.',
          });
        } else {
          toast.error('Delete Failed', {
            description: errorMessage
          });
        }
        
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      logger.error('Failed to delete product', error);
      
      // Only show generic error if we haven't already shown a specific one
      if (!errorMessage.includes('stock movements') && !errorMessage.includes('audit') && !errorMessage.includes('cannot be deleted')) {
        toast.error('Delete Failed', {
          description: errorMessage
        });
      }
      
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [apiService, isAuthenticated, user, fetchProducts, logger, state.products]);

  // Get product by ID
  const getProductById = useCallback((id: string): Product | undefined => {
    return state.products.find(product => product.id === id);
  }, [state.products]);

  // Search products
  const searchProducts = useCallback((query: string): Product[] => {
    if (!query.trim()) return state.products;
    
    const lowercaseQuery = query.toLowerCase();
    return state.products.filter(product =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.sku.toLowerCase().includes(lowercaseQuery) ||
      product.category.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery)
    );
  }, [state.products]);

  // Refresh products (alias for fetchProducts with force = true)
  const refreshProducts = useCallback(() => {
    return fetchProducts(true);
  }, [fetchProducts]);

  const value: ProductContextState = {
    // State
    products: state.products,
    isLoading: state.isLoading,
    error: state.error,
    isFromApi: state.isFromApi,
    
    // Actions
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
    
    // Utilities
    getProductById,
    searchProducts,
    
    // Status
    isOnline,
    isAuthenticated,
    
    // Stats
    totalProducts: state.products.length,
    lowStockProducts: state.products.filter(p => p.stock <= p.minStock).length,
    outOfStockProducts: state.products.filter(p => p.stock === 0).length,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextState => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
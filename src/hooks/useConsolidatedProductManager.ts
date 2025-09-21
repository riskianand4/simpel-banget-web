import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/types/inventory';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { createComponentLogger } from '@/utils/logger';
import { errorHandler } from '@/services/errorHandler';

interface ProductManagerState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  isFromApi: boolean;
}

/**
 * Consolidated Product Manager Hook - Replaces both useProductManager and useEnhancedProductManager
 * Provides unified product management with proper error handling, caching, and offline support
 */
export const useConsolidatedProductManager = () => {
  const logger = useMemo(() => createComponentLogger('ConsolidatedProductManager'), []);
  const { apiService, isAuthenticated, isOnline, user } = useApp();
  
  const [state, setState] = useState<ProductManagerState>({
    products: [],
    isLoading: true,
    error: null,
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
        component: 'ConsolidatedProductManager',
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
  }, [apiService, isAuthenticated, isOnline, logger]);

  // Auto-fetch with intelligent retry
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      // Debounce rapid auth/online changes
      const timeoutId = setTimeout(() => {
        fetchProducts();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isOnline]);

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
        await fetchProducts(true); // Refresh the list
        toast.success('Product deleted successfully');
        return true;
      } else {
        const errorMessage = response.error || 'Failed to delete product';
        
        // Handle specific backend errors
        if (errorMessage.includes('stock movements') || errorMessage.includes('audit') || errorMessage.includes('cannot be deleted')) {
          toast.error('Cannot Delete Product', {
            description: 'This product has stock movement history and cannot be deleted to preserve audit trail. Consider marking it as inactive instead.',
          });
        } else {
          toast.error('Delete Failed', {
            description: errorMessage
          });
        }
        
        throw new Error(errorMessage);
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
  }, [apiService, isAuthenticated, user, fetchProducts, logger]);

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

  return {
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
};
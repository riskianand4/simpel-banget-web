import { useState, useCallback, useEffect } from 'react';
import { Product } from '@/types/inventory';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { safeApiCall } from '@/services/apiResponseHandler';
import { globalProductCache } from '@/utils/globalProductCache';
import { useProductApi } from '@/services/productApi';

export const useEnhancedProductManager = () => {
  const { apiService, isConfigured, isOnline, isAuthenticated } = useApp();
  const { createProductWithImage, updateProductWithImage } = useProductApi();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Subscribe to global product cache and initial fetch
  useEffect(() => {
    const unsubscribe = globalProductCache.subscribe(() => {
      const cacheInfo = globalProductCache.getCacheInfo();
      if (cacheInfo.hasCache) {
        globalProductCache.getProducts().then(products => {
          setProducts(products);
        });
      }
    });

    // Initial fetch
    fetchProducts();

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch products with proper error handling
  const fetchProducts = useCallback(async () => {
    // Don't make API calls if not authenticated
    if (!isAuthenticated) {
      // Skipping product fetch - user not authenticated
      const saved = localStorage.getItem('products');
      const localProducts = saved ? JSON.parse(saved) : [];
      setProducts(localProducts);
      return localProducts;
    }

    setIsLoading(true);
    try {
      const fetcher = async () => {
        const response = await safeApiCall<Product[]>(
          () => apiService.getProducts(),
          'Failed to fetch products'
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to fetch products');
        }
      };

      const products = await globalProductCache.getProducts(fetcher);
      setProducts(products);
      return products;
    } catch (error) {
      // Error fetching products
      
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
        // Authentication error in fetchProducts
        toast.error('Please log in to access products');
        setProducts([]);
        return [];
      }
      
      toast.error('Failed to fetch products. Using local data.');
      
      // Fallback to localStorage
      const saved = localStorage.getItem('products');
      const localProducts = saved ? JSON.parse(saved) : [];
      setProducts(localProducts);
      return localProducts;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isAuthenticated]);

  // Add product with enhanced error handling
  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status'>, imageFile?: File) => {
    setIsLoading(true);
    try {
      const newProduct: Product = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...productData,
        stockStatus: productData.stock === 0 
          ? 'out_of_stock' 
          : productData.stock <= productData.minStock 
          ? 'low_stock' 
          : 'in_stock',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: productData.images || (productData.image ? [productData.image] : []),
      };

      // Creating new product with image data

      if (isConfigured && isOnline && apiService) {
        const response = await safeApiCall(
          () => imageFile ? createProductWithImage(newProduct, imageFile) : apiService.createProduct(newProduct),
          'Failed to create product'
        );

        if (response.success) {
          // Update local state and global cache
          setProducts(prev => [...prev, newProduct]);
          globalProductCache.addProduct(newProduct);
          
          // Also save to localStorage as backup
          const currentProducts = localStorage.getItem('products');
          const productsArray = currentProducts ? JSON.parse(currentProducts) : [];
          productsArray.push(newProduct);
          localStorage.setItem('products', JSON.stringify(productsArray));

          toast.success('Product Added', {
            description: `${newProduct.name} has been added successfully`,
          });
          
          return newProduct;
        } else {
          throw new Error(response.error || 'Failed to create product');
        }
      } else {
        // Use local storage only
        const currentProducts = localStorage.getItem('products');
        const productsArray = currentProducts ? JSON.parse(currentProducts) : [];
        productsArray.push(newProduct);
        localStorage.setItem('products', JSON.stringify(productsArray));
        
        setProducts(prev => [...prev, newProduct]);

        toast.success('Product Added Locally', {
          description: `${newProduct.name} has been saved locally`,
        });

        return newProduct;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific SKU conflict errors
      if (errorMessage.includes('SKU already exists') || errorMessage.includes('DUPLICATE_SKU')) {
        toast.error('SKU Sudah Ada', {
          description: 'Produk dengan SKU tersebut sudah terdaftar di sistem'
        });
      } else {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isConfigured, isOnline]);

  // Update product with enhanced error handling
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>, imageFile?: File) => {
    setIsLoading(true);
    try {
      // Calculate stock status if stock or minStock is being updated
      let stockStatus = updates.stockStatus;
      if (updates.stock !== undefined || updates.minStock !== undefined) {
        const currentProduct = products.find(p => p.id === id);
        const newStock = updates.stock !== undefined ? updates.stock : currentProduct?.stock || 0;
        const newMinStock = updates.minStock !== undefined ? updates.minStock : currentProduct?.minStock || 0;
        
        stockStatus = newStock === 0 
          ? 'out_of_stock' 
          : newStock <= newMinStock 
          ? 'low_stock' 
          : 'in_stock';
      }

      const updatedData = {
        ...updates,
        stockStatus,
        updatedAt: new Date().toISOString(),
        images: updates.images || (updates.image ? [updates.image] : undefined),
      };

      // Updating product with image data

      if (isConfigured && isOnline && apiService) {
        const response = await safeApiCall(
          () => imageFile ? updateProductWithImage(id, updatedData, imageFile) : apiService.updateProduct(id, updatedData),
          'Failed to update product'
        );

        // API response received

        if (response.success) {
          // Update local state and global cache
          setProducts(prev => prev.map(product => 
            product.id === id ? { ...product, ...updatedData } : product
          ));
          globalProductCache.updateProduct(id, updatedData);

          // Update localStorage
          const currentProducts = localStorage.getItem('products');
          const productsArray = currentProducts ? JSON.parse(currentProducts) : [];
          const productIndex = productsArray.findIndex((p: Product) => p.id === id);
          
          if (productIndex !== -1) {
            productsArray[productIndex] = { ...productsArray[productIndex], ...updatedData };
            localStorage.setItem('products', JSON.stringify(productsArray));
          }

          toast.success('Product Updated');
        } else {
          throw new Error(response.error || 'Failed to update product');
        }
      } else {
        // Local storage only
        const currentProducts = localStorage.getItem('products');
        const productsArray = currentProducts ? JSON.parse(currentProducts) : [];
        const productIndex = productsArray.findIndex((p: Product) => p.id === id);
        
        if (productIndex !== -1) {
          productsArray[productIndex] = { ...productsArray[productIndex], ...updatedData };
          localStorage.setItem('products', JSON.stringify(productsArray));
          
          setProducts(prev => prev.map(product => 
            product.id === id ? { ...product, ...updatedData } : product
          ));

          toast.success('Product Updated Locally');
        }
      }
    } catch (error) {
      // Product update error
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isConfigured, isOnline]);

  // Delete product with enhanced error handling
  const deleteProduct = useCallback(async (product: Product) => {
    setIsLoading(true);
    try {
      if (isConfigured && isOnline && apiService) {
        const response = await safeApiCall(
          () => apiService.deleteProduct(product.id),
          'Failed to delete product'
        );

        if (response.success) {
          // Immediately update local state - remove from UI
          setProducts(prev => {
            const updated = prev.filter(p => p.id !== product.id);
            // Also update localStorage immediately
            localStorage.setItem('products', JSON.stringify(updated));
            return updated;
          });
          
          // Update global cache
          globalProductCache.removeProduct(product.id);

          // Check if product was archived or deleted
          const responseData = response.data as any;
          const message = responseData?.message || '';
          if (message.includes('archived') || responseData?.archived) {
            toast.success('Produk Diarsipkan', {
              description: `${product.name} telah dinonaktifkan karena memiliki riwayat stok`
            });
          } else {
            toast.success('Produk Dihapus', {
              description: `${product.name} berhasil dihapus`
            });
          }
        } else {
          // Handle specific backend errors
          const errorMessage = response.error || 'Failed to delete product';
          
          if (errorMessage.includes('stock movements') || errorMessage.includes('audit')) {
            toast.error('Tidak Dapat Menghapus Produk', {
              description: 'Produk ini memiliki riwayat pergerakan stok sehingga tidak dapat dihapus demi menjaga jejak audit. Pertimbangkan untuk menandainya sebagai tidak aktif.',
            });
          } else {
            toast.error('Delete Failed', {
              description: errorMessage
            });
          }
          return;
        }
      } else {
        // Local storage only - ensure immediate removal
        setProducts(prev => {
          const updated = prev.filter(p => p.id !== product.id);
          localStorage.setItem('products', JSON.stringify(updated));
          return updated;
        });

        toast.success('Product Deleted Locally', {
          description: `${product.name} has been removed from local storage`
        });
      }
    } catch (error) {
      // Don't show duplicate error toast if we already handled it above
      if (!error?.toString().includes('stock movements') && !error?.toString().includes('audit')) {
        toast.error('Delete Failed', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred while deleting the product'
        });
      }
      return;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isConfigured, isOnline]);

  return {
    products,
    isLoading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: fetchProducts,
  };
};
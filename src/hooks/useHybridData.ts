import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Product } from '@/types/inventory';
import { globalProductCache } from '@/utils/globalProductCache';


interface UseHybridDataOptions {
  localData: any;
  localFunction?: () => any;
  apiEndpoint?: string;
  apiFunction?: () => Promise<any>;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseHybridDataReturn<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  isFromApi: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useHybridData<T>({
  localData,
  localFunction,
  apiEndpoint,
  apiFunction,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: UseHybridDataOptions): UseHybridDataReturn<T> {
  const { isConfigured, isOnline, apiService, isAuthenticated } = useApi();
  const { toast } = useToast();
  const { logApiError } = useErrorHandler('HybridData');
  
  const [data, setData] = useState<T>(localData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromApi, setIsFromApi] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const retryCount = useRef(0);
  const maxRetries = 3;

  const loadData = useCallback(async (isRetry: boolean = false) => {
    // Don't make API calls if not authenticated
    if (!isAuthenticated && (apiFunction || apiEndpoint)) {
      // Skipping API call - user not authenticated
      const result = localFunction ? localFunction() : localData;
      setData(result);
      setIsFromApi(false);
      setLastUpdated(new Date());
      return;
    }

    setIsLoading(true);
    setError(null);

    // Loading data with hybrid strategy

    try {
      // Use API if configured, online, and authenticated
      if (isConfigured && isOnline && isAuthenticated && apiService) {
        // Using API data source
        let response;
        
        if (apiFunction) {
          // Calling apiFunction
          response = await apiFunction();
        } else if (apiEndpoint) {
          // Calling apiService.request with endpoint
          response = await apiService.request(apiEndpoint);
        } else {
          throw new Error('No API function or endpoint provided');
        }
        
        // API Response received
        
        // Handle both direct data arrays and wrapped responses
        if (response && response.success && response.data !== undefined) {
          // Using response.data
          setData(response.data);
          setIsFromApi(true);
          setLastUpdated(new Date());
          retryCount.current = 0; // Reset retry count on success
        } else if (Array.isArray(response)) {
          // Handle direct array responses (legacy compatibility)
          // Using direct array response
          setData(response as T);
          setIsFromApi(true);
          setLastUpdated(new Date());
          retryCount.current = 0;
        } else {
          throw new Error(response?.error || response?.message || 'API request failed');
        }
      } else {
        // Using local data source
        // Fallback to local data
        const result = localFunction ? localFunction() : localData;
        // Local data result processed
        setData(result);
        setIsFromApi(false);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load data:', err);
      
      // Log API error if this was an API call and auth error
      if (isConfigured && isOnline && isAuthenticated && apiService) {
        logApiError(
          err instanceof Error ? err : new Error(errorMessage),
          'hybrid-data',
          'loadData'
        );
        
        // If authentication error, stop auto-refresh
        if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
          // Authentication error detected, stopping auto-refresh
          setError('Authentication required. Please log in again.');
          return; // Don't fallback to local data on auth errors
        }
      }
      
      setError(errorMessage);
      
      // Implement retry logic with exponential backoff
      if (isRetry && retryCount.current < maxRetries) {
        retryCount.current++;
        const delay = Math.pow(2, retryCount.current) * 1000; // 2s, 4s, 8s
        
        setTimeout(() => {
          loadData(true);
        }, delay);
        
        return;
      }
      
      // Fallback to local data on API error
      const result = localFunction ? localFunction() : localData;
      setData(result);
      setIsFromApi(false);
      setLastUpdated(new Date());
      
      // Only show toast for non-retry attempts to avoid spam
      if (!isRetry) {
        toast({
          title: "Connection Issue",
          description: "Using local data. Will retry automatically.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, isOnline, isAuthenticated, apiService, apiFunction, apiEndpoint, localFunction, localData, toast, logApiError]);

  const refresh = useCallback(async () => {
    retryCount.current = 0; // Reset retry count for manual refresh
    await loadData();
  }, [loadData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [isConfigured, isOnline, isAuthenticated]);

  // Auto refresh - only if authenticated and using API
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !isFromApi || !isConfigured || !isOnline) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isFromApi, isAuthenticated, isConfigured, isOnline, loadData]);

  return {
    data,
    isLoading,
    error,
    isFromApi,
    lastUpdated,
    refresh,
    clearError,
  };
}

// Specialized hooks for common use cases
export function useHybridProducts(): UseHybridDataReturn<Product[]> {
  const { apiService, isAuthenticated } = useApi();
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromApi, setIsFromApi] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Subscribe to global product cache
  useEffect(() => {
    const unsubscribe = globalProductCache.subscribe(() => {
      const cacheInfo = globalProductCache.getCacheInfo();
      if (cacheInfo.hasCache) {
        globalProductCache.getProducts().then(products => {
          setData(products);
          setIsFromApi(true);
          setLastUpdated(new Date());
          setIsLoading(false);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      // Skipping product fetch - user not authenticated
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetcher = async () => {
        if (!apiService) throw new Error('API service not available');
        const response = await apiService.getProducts();
        if (response?.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch products');
      };

      const products = await globalProductCache.getProducts(fetcher);
      setData(products);
      setIsFromApi(true);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Failed to load products
      setError(errorMessage);
      
      // Fallback to local data
      const localData = [];
      setData(localData);
      setIsFromApi(false);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isAuthenticated]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, refresh]);

  return {
    data,
    isLoading,
    error,
    isFromApi,
    lastUpdated,
    refresh,
    clearError,
  };
}

export function useHybridStockMovements() {
  return useHybridData({
    localData: [],
    apiEndpoint: '/api/stock/movements',
    autoRefresh: true,
  });
}

export function useHybridInventoryStats() {
  return useHybridData({
    localData: {
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      topProducts: [],
    },
    localFunction: () => {
      // Calculate from local data - will be replaced by API data
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        topProducts: [],
      };
    },
    apiEndpoint: '/api/analytics/overview',
    autoRefresh: true,
  });
}

// New hook for inventory items (transformed from products)
export function useHybridInventoryItems() {
  const { apiService } = useApi();
  
  return useHybridData({
    localData: [
      {
        id: '1',
        name: 'Router WiFi AC1200',
        code: 'RWF-001',
        category: 'Networking',
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        location: 'Telnet Banda Aceh',
        lastMovement: new Date(),
        status: 'in_stock' as const,
        value: 750000,
        unit: 'pcs'
      },
      {
        id: '2',
        name: 'Switch 24 Port',
        code: 'SW24-001',
        category: 'Networking',
        currentStock: 0,
        minStock: 8,
        maxStock: 50,
        location: 'Telnet Banda Aceh',
        lastMovement: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'out_of_stock' as const,
        value: 0,
        unit: 'pcs'
      },
      {
        id: '3',
        name: 'Cable UTP Cat6',
        code: 'UTP-C6',
        category: 'Accessories',
        currentStock: 0,
        minStock: 20,
        maxStock: 500,
        location: 'Telnet Meulaboh',
        lastMovement: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'out_of_stock' as const,
        value: 0,
        unit: 'meter'
      },
      {
        id: '4',
        name: 'Access Point',
        code: 'AP-001',
        category: 'Networking',
        currentStock: 45,
        minStock: 15,
        maxStock: 40,
        location: 'Telnet Meulaboh',
        lastMovement: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'overstock' as const,
        value: 1800000,
        unit: 'pcs'
      }
    ],
    localFunction: () => {
      // Transform products data to inventory items format - will be replaced by API data
      return [];
    },
    apiFunction: async () => {
      if (!apiService) throw new Error('API service not available');
      const response = await apiService.getProducts();
      if (response?.success && response.data) {
        // Transform API products to inventory items format
        return response.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          code: product.sku || product.productCode,
          category: product.category,
          currentStock: typeof product.stock === 'object' ? (product.stock?.current || 0) : (product.stock || 0),
          minStock: typeof product.stock === 'object' ? (product.stock?.minimum || 10) : (product.minStock || 10),
          maxStock: typeof product.stock === 'object' ? (product.stock?.maximum || 100) : (product.maxStock || 100),
          location: product.location || 'Telnet Banda Aceh',
          lastMovement: new Date(product.updatedAt || Date.now()),
          status: product.status,
          value: (product.price || 0) * (typeof product.stock === 'object' ? (product.stock?.current || 0) : (product.stock || 0)),
          unit: 'pcs'
        }));
      }
      throw new Error('Failed to fetch products');
    },
    autoRefresh: true,
  });
}
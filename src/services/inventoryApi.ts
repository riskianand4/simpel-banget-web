// Legacy inventory API compatibility layer
import { apiClient } from './apiClient';
import { logger } from '../utils/logger';

export class InventoryApiService {
  async healthCheck() {
    try {
      const response = await apiClient.healthCheck();
      logger.debug('Health check response', { response });
      
      // Backend returns {status: "OK", timestamp: "...", uptime: ..., version: "..."} 
      // ApiClient wraps it in ApiResponse format
      const isHealthy = response && (
        response.success === true || 
        (response as any).status === 'OK'
      );
      
      return {
        success: isHealthy,
        data: response,
        message: isHealthy ? 'Backend is healthy' : 'Backend health check failed'
      };
    } catch (error) {
      logger.error('Health check failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        message: 'Cannot connect to backend'
      };
    }
  }

  async getProducts(params?: any) {
    // Default to active products unless status is explicitly specified
    const defaultParams = { status: 'active', ...params };
    const queryString = defaultParams ? '?' + new URLSearchParams(defaultParams).toString() : '';
    
    logger.debug('Fetching products from API', { endpoint: `/api/products${queryString}` });
    
    try {
      const response = await apiClient.get(`/api/products${queryString}`);
      logger.debug('Raw API response', { response });
      
      // Backend returns { success: true, data: [...], pagination: {...} }
      if (response && response.success && response.data && Array.isArray(response.data)) {
        logger.info('Processing products from API', { count: response.data.length });
        
        const products = (response.data as any[]).map((product: any) => ({
          id: product.id || product._id,
          name: product.name,
          sku: product.sku,
          productCode: product.sku, // Use SKU as product code
          category: product.category,
          price: product.price,
          stock: typeof product.stock === 'object' ? (product.stock?.current || 0) : (product.stock || 0),
          minStock: typeof product.stock === 'object' ? (product.stock?.minimum || 0) : (product.minStock || 0),
          maxStock: typeof product.stock === 'object' ? (product.stock?.maximum || 0) : (product.maxStock || 0),
          status: product.status || 'active',
          stockStatus: product.stockStatus || 'in_stock',
          description: product.description || '',
          image: product.image || '',
          location: product.location?.warehouse || product.location || '',
          supplier: product.supplier?.name || product.supplier || '',
          unit: product.unit || 'pcs',
          barcode: product.barcode || '',
          tags: product.tags || [],
          costPrice: product.costPrice || 0,
          profitMargin: product.profitMargin || 0,
          images: product.images || [],
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }));
        
        logger.debug('Transformed products', { products });
        
        return {
          success: true,
          data: products,
          pagination: (response as any).pagination
        };
      }
      
      logger.warn('Unexpected response format', { response });
      return {
        success: false,
        data: [],
        error: 'Invalid response format'
      };
      
    } catch (error) {
      logger.error('Error fetching products', error);
      
      // Handle 401 errors specifically
      if (error instanceof Error && error.message.includes('Authentication required')) {
        // Try to refresh token and retry once
        const token = localStorage.getItem('auth-token');
        if (token) {
          // Set token again in case it was cleared
          apiClient.setToken(token);
          try {
            const retryResponse = await apiClient.get(`/api/products${queryString}`);
            if (retryResponse?.success) {
              logger.info('Retry successful after token refresh');
              return this.getProducts(params); // Recursive call to process the data
            }
          } catch (retryError) {
            logger.error('Retry failed', retryError);
          }
        }
      }
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      };
    }
  }

  async createProduct(data: any) {
    // Normalize payload to match backend schema
    const createData = {
      ...data,
      // Convert string location to backend object format
      location: typeof data.location === 'string' 
        ? { warehouse: data.location, shelf: '', bin: '' }
        : data.location,
      // Convert string supplier to backend object format
      supplier: typeof data.supplier === 'string'
        ? { name: data.supplier }
        : data.supplier,
      // Convert flat stock fields to nested object
      stock: {
        current: data.stock || 0,
        minimum: data.minStock || 0,
        maximum: data.maxStock || 0
      },
      // Normalize images array
      images: data.images || (data.image ? [{ url: data.image, isPrimary: true }] : [])
    };
    
    // Remove flat stock fields to avoid conflicts
    delete createData.minStock;
    delete createData.maxStock;
    
    const response = await apiClient.post('/api/products', createData);
    return response;
  }

  async updateProduct(id: string, data: any) {
    // Normalize payload to match backend schema
    const updateData: any = { ...data };
    
    // Convert string location to backend object format
    if (typeof data.location === 'string') {
      updateData.location = { warehouse: data.location, shelf: '', bin: '' };
    }
    
    // Convert string supplier to backend object format
    if (typeof data.supplier === 'string') {
      updateData.supplier = { name: data.supplier };
    }
    
    // Convert flat stock fields to nested object if any stock field is present
    if (data.stock !== undefined || data.minStock !== undefined || data.maxStock !== undefined) {
      updateData.stock = {
        current: data.stock,
        minimum: data.minStock,
        maximum: data.maxStock
      };
      // Remove flat stock fields to avoid conflicts
      delete updateData.minStock;
      delete updateData.maxStock;
    }
    
    // Normalize images array
    if (data.images || data.image) {
      updateData.images = data.images || (data.image ? [{ url: data.image, isPrimary: true }] : []);
    }
    
    const response = await apiClient.put(`/api/products/${id}`, updateData);
    
    return response;
  }

  async deleteProduct(id: string) {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response;
  }

  async getAnalyticsOverview() {
    const response = await apiClient.get('/api/analytics/overview');
    return response;
  }

  async getAnalyticsTrends(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/trends${queryString}`);
    return response;
  }

  async getCategoryAnalysis(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/category-analysis${queryString}`);
    return response;
  }

  async getStockVelocity(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/stock-velocity${queryString}`);
    return response;
  }

  async getSmartInsights(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/insights${queryString}`);
    return response;
  }

  async getStockAlerts() {
    const response = await apiClient.get('/api/analytics/alerts');
    return response;
  }

  async getStockMovements(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/stock/movements${queryString}`);
    return response;
  }

  async getInventoryStats() {
    const response = await apiClient.get('/api/analytics/overview');
    return response;
  }

  setToken(token: string | null) {
    apiClient.setToken(token);
  }

  getToken() {
    return apiClient.getToken();
  }

  // Generic request methods for compatibility across hooks/services
  async request(endpoint: string) {
    return apiClient.get(endpoint);
  }
  async get(endpoint: string) {
    return apiClient.get(endpoint);
  }
  async post(endpoint: string, data?: any) {
    return apiClient.post(endpoint, data);
  }
  async put(endpoint: string, data?: any) {
    return apiClient.put(endpoint, data);
  }
  async delete(endpoint: string) {
    return apiClient.delete(endpoint);
  }
}

export const initializeApiService = () => new InventoryApiService();
export const getApiService = () => new InventoryApiService();
export default InventoryApiService;
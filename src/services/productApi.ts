import { useApp } from '@/contexts/AppContext';

// Product API functions that work with the app context
export const useProductApi = () => {
  const { apiService } = useApp();

  const uploadProductImage = async (file: File): Promise<{ imagePath: string }> => {
    if (!apiService) throw new Error('API service not available');
    
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`/api/products/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.data;
  };

  const createProductWithImage = async (productData: any, imageFile?: File): Promise<any> => {
    if (!apiService) throw new Error('API service not available');

    let imagePath = '';
    
    // Upload image first if provided
    if (imageFile) {
      const uploadResult = await uploadProductImage(imageFile);
      imagePath = uploadResult.imagePath;
    }

    // Create product with image path
    const productPayload = {
      ...productData,
      image: imagePath,
      images: imagePath ? [imagePath] : []
    };

    return await apiService.createProduct(productPayload);
  };

  const updateProductWithImage = async (id: string, productData: any, imageFile?: File): Promise<any> => {
    if (!apiService) throw new Error('API service not available');

    let imagePath = productData.image || '';
    
    // Upload new image if provided
    if (imageFile) {
      const uploadResult = await uploadProductImage(imageFile);
      imagePath = uploadResult.imagePath;
    }

    // Update product with image path
    const productPayload = {
      ...productData,
      image: imagePath,
      images: imagePath ? [imagePath] : []
    };

    return await apiService.updateProduct(id, productPayload);
  };

  return {
    uploadProductImage,
    createProductWithImage,
    updateProductWithImage,
  };
};

// Simple mock services to avoid API response wrapper issues
import { Product } from '@/types/inventory';

export const getAllProducts = async (): Promise<Product[]> => {
  return [];
};

export const getProductById = async (id: string): Promise<Product> => {
  throw new Error('Not implemented');
};

export const createProduct = async (product: any): Promise<Product> => {
  throw new Error('Not implemented');
};

export const updateProduct = async (id: string, product: any): Promise<Product> => {
  throw new Error('Not implemented');
};

export const deleteProduct = async (id: string): Promise<void> => {
  throw new Error('Not implemented');
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  return [];
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  return [];
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  return [];
};

export const getOutOfStockProducts = async (): Promise<Product[]> => {
  return [];
};

export const updateProductStock = async (id: string, stock: number): Promise<Product> => {
  throw new Error('Not implemented');
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getLowStockProducts,
  getOutOfStockProducts,
  updateProductStock,
};
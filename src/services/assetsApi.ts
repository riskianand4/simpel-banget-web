import { apiClient } from './apiClient';
import { Asset } from '@/types/assets';
import { handleApiResponse, safeApiCall } from './apiResponseHandler';

// Data mapper to convert backend data to frontend format
const mapBackendAssetToFrontend = (backendAsset: any): Asset => {
  return {
    id: backendAsset._id || backendAsset.id,
    name: backendAsset.name,
    code: backendAsset.assetCode || backendAsset.code,
    category: backendAsset.category,
    quantity: backendAsset.quantity || 1,
    location: backendAsset.location || '',
    condition: backendAsset.condition || 'good',
    status: backendAsset.status || 'available',
    description: backendAsset.description || '',
    picId: backendAsset.assignedTo || null,
    picName: backendAsset.assignedToName || null,
    purchaseDate: new Date(backendAsset.purchaseDate),
    purchasePrice: backendAsset.purchasePrice || 0,
    image: backendAsset.image || backendAsset.images?.[0] || '',
    maintenanceHistory: backendAsset.maintenanceHistory || [],
    borrowedBy: backendAsset.borrowedBy || undefined,
    createdAt: new Date(backendAsset.createdAt || backendAsset.created_at),
    updatedAt: new Date(backendAsset.updatedAt || backendAsset.updated_at)
  };
};

// Data mapper to convert frontend data to backend format
const mapFrontendAssetToBackend = (frontendAsset: Partial<Asset>): any => {
  const backendAsset: any = {};
  
  if (frontendAsset.name) backendAsset.name = frontendAsset.name;
  if (frontendAsset.code) backendAsset.assetCode = frontendAsset.code;
  if (frontendAsset.category) backendAsset.category = frontendAsset.category;
  if (frontendAsset.quantity) backendAsset.quantity = frontendAsset.quantity;
  
  // Convert string location to backend object format
  if (frontendAsset.location) {
    if (typeof frontendAsset.location === 'string') {
      backendAsset.location = {
        department: frontendAsset.location,
        room: '',
        building: ''
      };
    } else {
      backendAsset.location = frontendAsset.location;
    }
  }
  
  if (frontendAsset.condition) backendAsset.condition = frontendAsset.condition;
  if (frontendAsset.status) backendAsset.status = frontendAsset.status;
  if (frontendAsset.description) backendAsset.description = frontendAsset.description;
  if (frontendAsset.picId) backendAsset.assignedTo = frontendAsset.picId;
  if (frontendAsset.purchaseDate) backendAsset.purchaseDate = frontendAsset.purchaseDate.toISOString();
  if (frontendAsset.purchasePrice) backendAsset.purchasePrice = frontendAsset.purchasePrice;
  if (frontendAsset.image) backendAsset.image = frontendAsset.image;
  
  return backendAsset;
};

// Get all assets
export const getAllAssets = async (): Promise<Asset[]> => {
  const response = await safeApiCall<any[]>(
    () => apiClient.get('/api/assets'),
    'Failed to fetch assets'
  );
  if (response.success && response.data) {
    return response.data.map(mapBackendAssetToFrontend);
  }
  return [];
};

// Get asset by ID
export const getAssetById = async (id: string): Promise<Asset | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/assets/${id}`),
    'Failed to fetch asset'
  );
  if (response.success && response.data) {
    return mapBackendAssetToFrontend(response.data);
  }
  return null;
};

// Create new asset
export const createAsset = async (assetData: Partial<Asset>): Promise<Asset | null> => {
  const backendData = mapFrontendAssetToBackend(assetData);
  const response = await safeApiCall<any>(
    () => apiClient.post('/api/assets', backendData),
    'Failed to create asset'
  );
  if (response.success && response.data) {
    return mapBackendAssetToFrontend(response.data);
  }
  return null;
};

// Update asset
export const updateAsset = async (id: string, assetData: Partial<Asset>): Promise<Asset | null> => {
  const backendData = mapFrontendAssetToBackend(assetData);
  const response = await safeApiCall<any>(
    () => apiClient.put(`/api/assets/${id}`, backendData),
    'Failed to update asset'
  );
  if (response.success && response.data) {
    return mapBackendAssetToFrontend(response.data);
  }
  return null;
};

// Delete asset
export const deleteAsset = async (id: string): Promise<boolean> => {
  const response = await safeApiCall<boolean>(
    () => apiClient.delete(`/api/assets/${id}`),
    'Failed to delete asset'
  );
  return response.success;
};

// Borrow asset
export const borrowAsset = async (id: string, borrowData: {
  borrowedBy: string;
  returnDueDate?: Date;
  notes?: string;
}): Promise<Asset | null> => {
  const backendData = {
    borrowedBy: borrowData.borrowedBy,
    returnDueDate: borrowData.returnDueDate?.toISOString(),
    notes: borrowData.notes
  };
  
  const response = await safeApiCall<any>(
    () => apiClient.post(`/api/assets/${id}/borrow`, backendData),
    'Failed to borrow asset'
  );
  if (response.success && response.data) {
    return mapBackendAssetToFrontend(response.data);
  }
  return null;
};

// Return asset
export const returnAsset = async (id: string, returnData?: {
  returnNotes?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
}): Promise<Asset | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.post(`/api/assets/${id}/return`, returnData || {}),
    'Failed to return asset'
  );
  if (response.success && response.data) {
    return mapBackendAssetToFrontend(response.data);
  }
  return null;
};

// Assign asset to PIC
export const assignAssetToPIC = async (id: string, assignData: {
  assignedTo: string;
  assignmentDate?: Date;
  notes?: string;
}): Promise<Asset | null> => {
  const backendData = {
    assignedTo: assignData.assignedTo,
    assignmentDate: assignData.assignmentDate?.toISOString(),
    notes: assignData.notes
  };
  
  const response = await safeApiCall<any>(
    () => apiClient.post(`/api/assets/${id}/assign`, backendData),
    'Failed to assign asset'
  );
  if (response.success && response.data) {
    return mapBackendAssetToFrontend(response.data);
  }
  return null;
};

// Search assets
export const searchAssets = async (query: string): Promise<Asset[]> => {
  const response = await safeApiCall<any[]>(
    () => apiClient.get(`/api/assets/search?q=${encodeURIComponent(query)}`),
    'Failed to search assets'
  );
  if (response.success && response.data) {
    return response.data.map(mapBackendAssetToFrontend);
  }
  return [];
};

// Get assets by category
export const getAssetsByCategory = async (category: string): Promise<Asset[]> => {
  const response = await safeApiCall<any[]>(
    () => apiClient.get(`/api/assets?category=${encodeURIComponent(category)}`),
    'Failed to fetch assets by category'
  );
  if (response.success && response.data) {
    return response.data.map(mapBackendAssetToFrontend);
  }
  return [];
};

// Get assets by status
export const getAssetsByStatus = async (status: string): Promise<Asset[]> => {
  const response = await safeApiCall<any[]>(
    () => apiClient.get(`/api/assets?status=${encodeURIComponent(status)}`),
    'Failed to fetch assets by status'
  );
  if (response.success && response.data) {
    return response.data.map(mapBackendAssetToFrontend);
  }
  return [];
};

export default {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  borrowAsset,
  returnAsset,
  assignAssetToPIC,
  searchAssets,
  getAssetsByCategory,
  getAssetsByStatus,
};
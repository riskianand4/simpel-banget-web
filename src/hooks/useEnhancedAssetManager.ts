import { useState, useCallback } from 'react';
import { Asset, AssetBorrowRequest } from '@/types/assets';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { safeApiCall } from '@/services/apiResponseHandler';

export const useEnhancedAssetManager = () => {
  const { user, apiService, isConfigured, isOnline } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Fetch assets with proper error handling
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isConfigured && isOnline && apiService) {
        const response = await safeApiCall(
          () => apiService.get('/api/assets'),
          'Failed to fetch assets'
        );

        // Assets fetched successfully

        if (response.success && response.data) {
          // Handle both direct array and paginated response
          const assetsArray = Array.isArray(response.data) 
            ? response.data 
            : (response.data as any)?.data || [];

          // Map backend data to frontend format
          const mappedAssets = assetsArray.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            code: item.assetCode || item.code,
            category: item.category,
            quantity: item.quantity || 1, // Fix: Add quantity mapping
            description: item.description || '',
            condition: item.condition,
            status: item.status,
            location: typeof item.location === 'string' 
              ? item.location 
              : `${item.location?.department || ''} ${item.location?.room || ''} ${item.location?.building || ''}`.trim(),
            purchaseDate: new Date(item.purchaseDate),
            purchasePrice: item.purchasePrice || item.currentValue || 0,
            maintenanceHistory: item.maintenanceHistory || [],
            picId: item.assignedTo?.user || item.picId,
            picName: item.assignedTo?.userName || item.picName,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
          }));

          setAssets(mappedAssets);
          // Save to localStorage as backup
          localStorage.setItem('assets', JSON.stringify(mappedAssets));
          return mappedAssets;
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('assets');
      const localAssets = saved ? JSON.parse(saved) : [];
      setAssets(localAssets);
      return localAssets;
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to fetch assets. Using local data.');
      
      // Fallback to localStorage
      const saved = localStorage.getItem('assets');
      const localAssets = saved ? JSON.parse(saved) : [];
      setAssets(localAssets);
      return localAssets;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isConfigured, isOnline]);

  // Add asset with enhanced error handling
  const addAsset = useCallback(async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || user.role !== 'superadmin') {
      toast.error('You do not have permission to add assets');
      return;
    }

    setIsLoading(true);
    try {
      // Adding asset with provided data

      if (isConfigured && isOnline && apiService) {
        // Map frontend data to backend format
        const backendData = {
          name: assetData.name,
          assetCode: assetData.code, // Map code to assetCode for backend
          category: assetData.category,
          description: assetData.description,
          purchasePrice: assetData.purchasePrice,
          purchaseDate: assetData.purchaseDate.toISOString(),
          condition: assetData.condition,
          status: assetData.status,
          location: {
            department: assetData.location || '',
            room: '',
            building: ''
          }
        };

        // Sending data to backend

        const response = await safeApiCall(
          () => apiService.post('/api/assets', backendData),
          'Failed to create asset'
        );

        // Backend response received

        if (response.success && response.data) {
          // Map backend response to frontend format
          const backendAsset = response.data as any;
          const newAsset: Asset = {
            id: backendAsset._id || backendAsset.id,
            name: backendAsset.name,
            code: backendAsset.assetCode,
            category: backendAsset.category,
            quantity: backendAsset.quantity || 1,
            description: backendAsset.description || '',
            condition: backendAsset.condition,
            status: backendAsset.status,
            location: typeof backendAsset.location === 'string' 
              ? backendAsset.location 
              : `${backendAsset.location?.department || ''} ${backendAsset.location?.room || ''} ${backendAsset.location?.building || ''}`.trim(),
            purchaseDate: new Date(backendAsset.purchaseDate),
            purchasePrice: backendAsset.purchasePrice,
            maintenanceHistory: backendAsset.maintenanceHistory || [],
            createdAt: new Date(backendAsset.createdAt),
            updatedAt: new Date(backendAsset.updatedAt)
          };

          setAssets(prev => [...prev, newAsset]);
          
          // Update localStorage
          const currentAssets = localStorage.getItem('assets');
          const assetsArray = currentAssets ? JSON.parse(currentAssets) : [];
          assetsArray.push(newAsset);
          localStorage.setItem('assets', JSON.stringify(assetsArray));

          toast.success(`Asset Added: ${newAsset.name} has been added successfully`);
          
          return newAsset;
        } else {
          // Backend error occurred
          throw new Error(response.error || 'Failed to create asset');
        }
      } else {
        // Local storage only - create with frontend format
        const newAsset: Asset = {
          ...assetData,
          id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          maintenanceHistory: []
        };

        const currentAssets = localStorage.getItem('assets');
        const assetsArray = currentAssets ? JSON.parse(currentAssets) : [];
        assetsArray.push(newAsset);
        localStorage.setItem('assets', JSON.stringify(assetsArray));
        
        setAssets(prev => [...prev, newAsset]);

        toast.success(`Asset Added Locally: ${newAsset.name} has been saved locally`);

        return newAsset;
      }
    } catch (error) {
      // Error adding asset
      toast.error(error instanceof Error ? error.message : 'Failed to add asset');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, apiService, isConfigured, isOnline]);

  // Update asset with enhanced error handling
  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    if (!user || user.role !== 'superadmin') {
      toast.error('You do not have permission to update assets');
      return;
    }

    setIsLoading(true);
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (isConfigured && isOnline && apiService) {
        // Map frontend updates to backend format
        const backendData = {
          ...updatedData,
          // Map code to assetCode for backend
          ...(updatedData.code && { assetCode: updatedData.code }),
          // Convert string location to backend object format
          ...(updatedData.location && typeof updatedData.location === 'string' && {
            location: {
              department: updatedData.location,
              room: '',
              building: ''
            }
          })
        };
        
        // Remove frontend-only fields
        delete backendData.code;
        
        const response = await safeApiCall(
          () => apiService.put(`/api/assets/${id}`, backendData),
          'Failed to update asset'
        );

        if (response.success) {
          setAssets(prev => prev.map(asset => 
            asset.id === id ? { ...asset, ...updatedData } : asset
          ));

          // Update localStorage
          const currentAssets = localStorage.getItem('assets');
          const assetsArray = currentAssets ? JSON.parse(currentAssets) : [];
          const assetIndex = assetsArray.findIndex((a: Asset) => a.id === id);
          
          if (assetIndex !== -1) {
            assetsArray[assetIndex] = { ...assetsArray[assetIndex], ...updatedData };
            localStorage.setItem('assets', JSON.stringify(assetsArray));
          }

          toast.success('Asset Updated successfully');
        } else {
          throw new Error(response.error || 'Failed to update asset');
        }
      } else {
        // Local storage only
        const currentAssets = localStorage.getItem('assets');
        const assetsArray = currentAssets ? JSON.parse(currentAssets) : [];
        const assetIndex = assetsArray.findIndex((a: Asset) => a.id === id);
        
        if (assetIndex !== -1) {
          assetsArray[assetIndex] = { ...assetsArray[assetIndex], ...updatedData };
          localStorage.setItem('assets', JSON.stringify(assetsArray));
          
          setAssets(prev => prev.map(asset => 
            asset.id === id ? { ...asset, ...updatedData } : asset
          ));

          toast.success('Asset updated locally');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update asset');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, apiService, isConfigured, isOnline]);

  // Delete asset with enhanced error handling
  const deleteAsset = useCallback(async (id: string) => {
    if (!user || user.role !== 'superadmin') {
      toast.error('You do not have permission to delete assets');
      return;
    }

    const asset = assets.find(a => a.id === id);
    if (asset?.status === 'borrowed') {
      toast.error('Cannot delete asset that is currently borrowed');
      return;
    }

    setIsLoading(true);
    try {
      if (isConfigured && isOnline && apiService) {
        const response = await safeApiCall(
          () => apiService.delete(`/api/assets/${id}`),
          'Failed to delete asset'
        );

        if (response.success) {
          setAssets(prev => prev.filter(asset => asset.id !== id));

          // Update localStorage
          const currentAssets = localStorage.getItem('assets');
          const assetsArray = currentAssets ? JSON.parse(currentAssets) : [];
          const filteredAssets = assetsArray.filter((a: Asset) => a.id !== id);
          localStorage.setItem('assets', JSON.stringify(filteredAssets));

          toast.success('Asset deleted successfully');
        } else {
          throw new Error(response.error || 'Failed to delete asset');
        }
      } else {
        // Local storage only
        const currentAssets = localStorage.getItem('assets');
        const assetsArray = currentAssets ? JSON.parse(currentAssets) : [];
        const filteredAssets = assetsArray.filter((a: Asset) => a.id !== id);
        localStorage.setItem('assets', JSON.stringify(filteredAssets));
        
        setAssets(prev => prev.filter(asset => asset.id !== id));

        toast.success('Asset deleted locally');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete asset');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, assets, apiService, isConfigured, isOnline]);

  // Borrow asset
  const borrowAsset = useCallback(async (borrowRequest: AssetBorrowRequest) => {
    if (!user || user.role !== 'superadmin') {
      toast.error('You do not have permission to borrow assets');
      return;
    }

    const asset = assets.find(a => a.id === borrowRequest.assetId);
    if (!asset) {
      toast.error('Asset not found');
      return;
    }

    if (asset.status !== 'available') {
      toast.error('Asset is not available for borrowing');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        status: 'borrowed' as const,
        borrowedBy: {
          userId: borrowRequest.borrowerUserId,
          userName: borrowRequest.borrowerUserName,
          borrowDate: new Date(),
          expectedReturnDate: borrowRequest.expectedReturnDate,
          notes: borrowRequest.notes
        },
        updatedAt: new Date()
      };

      await updateAsset(borrowRequest.assetId, updateData);

      toast.success('Asset borrowed successfully');
    } catch (error) {
      toast.error('Failed to borrow asset');
    } finally {
      setIsLoading(false);
    }
  }, [user, assets, updateAsset]);

  // Return asset
  const returnAsset = useCallback(async (assetId: string, notes?: string) => {
    if (!user || user.role !== 'superadmin') {
      toast.error('You do not have permission to return assets');
      return;
    }

    const asset = assets.find(a => a.id === assetId);
    if (!asset || asset.status !== 'borrowed') {
      toast.error('Asset is not currently borrowed');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        status: 'available' as const,
        borrowedBy: asset.borrowedBy ? {
          ...asset.borrowedBy,
          actualReturnDate: new Date(),
          notes: notes || asset.borrowedBy.notes
        } : undefined,
        updatedAt: new Date()
      };

      await updateAsset(assetId, updateData);

      toast.success('Asset returned successfully');
    } catch (error) {
      toast.error('Failed to return asset');
    } finally {
      setIsLoading(false);
    }
  }, [user, assets, updateAsset]);

  return {
    assets,
    isLoading,
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    borrowAsset,
    returnAsset,
    refreshAssets: fetchAssets,
  };
};
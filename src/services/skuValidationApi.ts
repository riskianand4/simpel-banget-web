import { useApp } from '@/contexts/AppContext';

export interface SKUConflict {
  sku: string;
  existingProduct: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface SKUValidationResult {
  conflicts: SKUConflict[];
  available: string[];
  hasConflicts: boolean;
}

export const useSKUValidation = () => {
  const { apiService } = useApp();

  const validateSKUs = async (skus: string[]): Promise<SKUValidationResult> => {
    if (!apiService) throw new Error('API service not available');
    
    const response = await fetch('/api/products/validate-skus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: JSON.stringify({ skus }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate SKUs');
    }

    const data = await response.json();
    return data.data;
  };

  const generateUniqueSKU = (baseSKU: string, existingSKUs: string[]): string => {
    let counter = 1;
    let newSKU = `${baseSKU}-${counter.toString().padStart(2, '0')}`;
    
    while (existingSKUs.includes(newSKU.toUpperCase())) {
      counter++;
      newSKU = `${baseSKU}-${counter.toString().padStart(2, '0')}`;
    }
    
    return newSKU;
  };

  return {
    validateSKUs,
    generateUniqueSKU,
  };
};
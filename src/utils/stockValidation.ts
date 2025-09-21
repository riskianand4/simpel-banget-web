import { Product } from '@/types/inventory';
import { getProductStockStatus } from './productStatusHelpers';

/**
 * Enhanced data validation and debugging utilities for stock management
 */

export interface StockValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

/**
 * Validate product stock data and provide insights
 */
export const validateProductStock = (product: Product): StockValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];

  // Basic validation
  if (product.stock < 0) {
    errors.push('Stock tidak boleh negatif');
  }

  if (product.minStock < 0) {
    errors.push('Minimum stock tidak boleh negatif');
  }

  if (product.maxStock && product.maxStock < 0) {
    errors.push('Maximum stock tidak boleh negatif');
  }

  // Business logic validation
  if (product.maxStock && product.minStock > product.maxStock) {
    errors.push('Minimum stock tidak boleh lebih besar dari maximum stock');
  }

  // Edge cases that might cause confusion
  if (product.stock === 0 && product.minStock === 0) {
    warnings.push('Produk dengan stock 0 dan minStock 0 - pertimbangkan untuk set minStock');
    recommendations.push('Set minimum stock untuk mencegah stockout');
  }

  if (!product.maxStock || product.maxStock === 0) {
    warnings.push('Maximum stock tidak ditetapkan - progress bar menggunakan estimasi');
    recommendations.push('Set maximum stock untuk tracking yang lebih akurat');
  }

  if (product.minStock === 0) {
    warnings.push('Minimum stock adalah 0 - sistem akan menggunakan threshold default');
    recommendations.push('Set minimum stock berdasarkan demand rata-rata');
  }

  // Critical status detection
  const calculatedStatus = getProductStockStatus(product);
  if (product.stockStatus && product.stockStatus !== calculatedStatus) {
    warnings.push(`Status API (${product.stockStatus}) berbeda dengan kalkulasi (${calculatedStatus})`);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    recommendations
  };
};

/**
 * Get enhanced stock insights for debugging
 */
export const getStockInsights = (product: Product) => {
  const validation = validateProductStock(product);
  const calculatedStatus = getProductStockStatus(product);
  
  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku
    },
    stockData: {
      current: product.stock,
      minimum: product.minStock,
      maximum: product.maxStock,
      unit: product.unit || 'pcs'
    },
    status: {
      api: product.stockStatus,
      calculated: calculatedStatus,
      match: product.stockStatus === calculatedStatus
    },
    validation,
    flags: {
      isOutOfStock: product.stock === 0,
      isLowStock: calculatedStatus === 'low_stock',
      hasZeroMinStock: product.minStock === 0,
      hasNoMaxStock: !product.maxStock || product.maxStock === 0,
      needsAttention: validation.warnings.length > 0 || validation.errors.length > 0
    }
  };
};

/**
 * Bulk validate products and identify issues
 */
export const bulkValidateProducts = (products: Product[]) => {
  const results = products.map(getStockInsights);
  
  const summary = {
    total: products.length,
    valid: results.filter(r => r.validation.isValid).length,
    withErrors: results.filter(r => r.validation.errors.length > 0).length,
    withWarnings: results.filter(r => r.validation.warnings.length > 0).length,
    needingAttention: results.filter(r => r.flags.needsAttention).length,
    criticalIssues: results.filter(r => 
      r.flags.isOutOfStock || 
      (r.flags.isLowStock && r.stockData.current > 0)
    ).length
  };

  return {
    summary,
    results,
    criticalProducts: results.filter(r => r.flags.needsAttention),
    recommendations: [
      ...new Set(
        results.flatMap(r => r.validation.recommendations)
      )
    ]
  };
};

/**
 * Debug helper to log stock calculation details
 */
export const debugStockCalculation = (product: Product) => {
  console.group(`🔍 Stock Analysis: ${product.name}`);
  
  const insights = getStockInsights(product);
  
  // Stock validation completed
  
  if (insights.validation.errors.length > 0) {
    console.error('❌ Errors:', insights.validation.errors);
  }
  
  // Validation complete
  
  return insights;
};
import { Product } from '@/types/inventory';

/**
 * Get stock status from a product with backward compatibility
 * PRIORITY: Calculate from actual stock levels first, use API stockStatus as fallback only
 */
export const getProductStockStatus = (product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  // Stock status debug disabled for production

  // ALWAYS prioritize actual stock calculation over API stockStatus
  // This fixes the issue where API returns "in_stock" for 0 stock products
  
  // CRITICAL FIX: Handle out of stock first, regardless of minStock value
  if (product.stock === 0) {
    // Classified as OUT_OF_STOCK
    return 'out_of_stock';
  }
  
  // CRITICAL FIX: Only check low stock if stock > 0 and minStock > 0
  // This prevents the bug where stock=0, minStock=0 would trigger low_stock
  if (product.minStock > 0 && product.stock > 0 && product.stock <= product.minStock) {
    // Classified as LOW_STOCK
    return 'low_stock';
  }
  
  // Edge case: If minStock is 0 and stock is very low (1-5), consider it low stock
  if (product.minStock === 0 && product.stock > 0 && product.stock <= 5) {
    // Classified as LOW_STOCK (emergency threshold)
    return 'low_stock';
  }
  
  // Only use API stockStatus if calculation doesn't indicate critical status
  // and when stock levels seem normal
  if (product.stockStatus && product.stock > Math.max(product.minStock, 1)) {
    // Using API stockStatus as fallback
    return product.stockStatus;
  }
  
  // Classified as IN_STOCK (default)
  return 'in_stock';
};

/**
 * Filter products by stock status
 */
export const filterProductsByStockStatus = (products: Product[], status: 'in_stock' | 'low_stock' | 'out_of_stock'): Product[] => {
  return products.filter(product => getProductStockStatus(product) === status);
};

/**
 * Get stock status counts
 */
export const getStockStatusCounts = (products: Product[]) => {
  const inStock = filterProductsByStockStatus(products, 'in_stock').length;
  const lowStock = filterProductsByStockStatus(products, 'low_stock').length;
  const outOfStock = filterProductsByStockStatus(products, 'out_of_stock').length;
  
  return { inStock, lowStock, outOfStock };
};
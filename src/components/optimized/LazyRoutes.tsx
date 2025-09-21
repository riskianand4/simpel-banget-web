// Lazy-loaded route components for better performance
import { lazy } from 'react';
import AssetsPage from '@/pages/AssetsPage';

// Lazy load all page components using standard React.lazy
export const LazyIndex = lazy(() => import('@/pages/Index'));
export const LazyAuditLogPage = lazy(() => import('@/pages/AuditLogPage'));
export const LazyProductsPage = lazy(() => import('@/pages/ProductsPage'));
export const LazyInventoryPage = lazy(() => import('@/pages/InventoryPage'));
export const LazyAssetsPage = AssetsPage;
export const LazyOrdersPage = lazy(() => import('@/pages/OrdersPage'));
export const LazyAlertsPage = lazy(() => import('@/pages/AlertsPage'));
export const LazyUsersPage = lazy(() => import('@/pages/UsersPage'));
export const LazySettingsPage = lazy(() => import('@/pages/SettingsPage'));
export const LazyDatabasePage = lazy(() => import('@/pages/DatabasePage'));
export const LazySecurityPage = lazy(() => import('@/pages/SecurityPage'));
export const LazyStockReportPage = lazy(() => import('@/pages/StockReportPage'));
export const LazyStockMovementPage = lazy(() => import('@/pages/StockMovementPage'));
export const LazyStockOpnamePage = lazy(() => import('@/pages/StockOpnamePage'));
export const LazyDocumentationPage = lazy(() => import('@/pages/DocumentationPage'));
export const LazyAIStudioPage = lazy(() => import('@/pages/AIStudioPage'));
export const LazyApiManagementPage = lazy(() => import('@/pages/ApiManagementPage'));
export const LazyVendorsPage = lazy(() => import('@/pages/VendorsPage'));
// export const LazyAdminMonitorPage = lazy(() => import('@/pages/AdminMonitorPage')); // Removed - admin role deleted
export const LazyMorePage = lazy(() => import('@/pages/MorePage'));
export const LazyNotFound = lazy(() => import('@/pages/NotFound'));
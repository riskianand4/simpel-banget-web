import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";

import { ScrollRestoration } from "./components/ScrollRestoration";
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OptimizedAlertMonitor from '@/components/alerts/OptimizedAlertMonitor';
import { LayoutSkeleton } from "@/components/ui/layout-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { PSBLayout } from './components/psb/PSBLayout';

// Lazy load all page components for better performance
import {
  LazyIndex,
  LazyAuditLogPage,
  LazyProductsPage,
  LazyInventoryPage,
  LazyAssetsPage,
  LazyOrdersPage,
  LazyAlertsPage,
  LazyUsersPage,
  LazySettingsPage,
  LazyDatabasePage,
  LazySecurityPage,
  LazyStockReportPage,
  LazyStockMovementPage,
  LazyStockOpnamePage,
  LazyDocumentationPage,
  LazyAIStudioPage,
  LazyApiManagementPage,
  LazyVendorsPage,
  LazyMorePage,
  LazyNotFound
} from "./components/optimized/LazyRoutes";



const App = () => {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <ScrollRestoration />
        <Suspense fallback={<AppLoadingSkeleton />}>
          <Routes>
            {/* PSB Report Routes - Separate App */}
            <Route path="/psb-report/*" element={
              <ProtectedRoute>
                <PSBLayout />
              </ProtectedRoute>
            } />
            
            {/* User accessible routes */}
            <Route path="/" element={<LazyIndex />} />
            <Route path="/audit-log" element={<LazyAuditLogPage />} />
            <Route path="/products" element={<LazyProductsPage />} />
            <Route path="/assets" element={<LazyAssetsPage />} />
            <Route path="/asset" element={<LazyAssetsPage />} />
            <Route path="/inventory" element={<LazyInventoryPage />} />
            <Route path="/orders" element={<LazyOrdersPage />} />
            <Route path="/stock-opname" element={<LazyStockOpnamePage />} />
            <Route path="/documentation" element={<LazyDocumentationPage />} />
            <Route path="/ai-studio" element={<LazyAIStudioPage />} />
            <Route path="/vendors" element={<LazyVendorsPage />} />
            <Route path="/more" element={<LazyMorePage />} />

            {/* Superadmin-only routes */}
            <Route path="/alerts" element={
              <ProtectedRoute requiredRole="superadmin">
                <LazyAlertsPage />
              </ProtectedRoute>
            } />

            {/* Settings - All users */}
            <Route path="/settings" element={<LazySettingsPage />} />
            

          {/* Admin and Super Admin routes */}
          <Route path="/users" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/stock-movement" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyStockMovementPage />
            </ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazySecurityPage />
            </ProtectedRoute>
          } />
          <Route path="/stock-report" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyStockReportPage />
            </ProtectedRoute>
          } />

          {/* Super admin-only routes */}
          <Route path="/database" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyDatabasePage />
            </ProtectedRoute>
          } />
          <Route path="/api-management" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyApiManagementPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<LazyNotFound />} />
        </Routes>
      </Suspense>
      <OptimizedAlertMonitor />
    </TooltipProvider>
  </ErrorBoundary>
  );
};

// Loading skeleton component that adapts to mobile/desktop
const AppLoadingSkeleton = () => {
  const isMobile = useIsMobile();
  return <LayoutSkeleton isMobile={isMobile} />;
};

export default App;
// Script to fix role inconsistencies
const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    content = content.replace(/['"]super_admin['"]/g, '"superadmin"');
    content = content.replace(/super_admin/g, 'superadmin');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  }
}

const filesToFix = [
  'src/components/ai/AIAssistant.tsx',
  'src/components/assets/AssetTable.tsx',
  'src/components/dashboard/DashboardLayout.tsx',
  'src/components/dashboard/EnhancedDashboard.tsx',
  'src/components/dashboard/ModernProductGrid.tsx',
  'src/components/dashboard/ProductDetailModal.tsx',
  'src/components/dashboard/ProductGrid.tsx',
  'src/components/inventory/StockMovementHistory.tsx',
  'src/components/layout/EnhancedQuickSearch.tsx',
  'src/components/layout/QuickSearch.tsx',
  'src/components/products/ProductCard.tsx',
  'src/components/products/ProductDetailModal.tsx',
  'src/components/products/ProductTable.tsx',
  'src/hooks/useAssetManager.ts',
  'src/hooks/useAutoAlerts.ts',
  'src/hooks/useEnhancedAssetManager.ts',
  'src/pages/AdminMonitorPage.tsx',
  'src/pages/AlertsPage.tsx',
  'src/pages/AssetsPage.tsx',
  'src/pages/Index.tsx',
  'src/pages/MorePage.tsx',
  'src/pages/OrdersPage.tsx',
  'src/pages/SettingsPage.tsx',
  'src/pages/UsersPage.tsx',
  'src/components/layout/AppSidebar.tsx',
  'src/components/layout/MainLayout.tsx',
  'src/components/layout/MobileBottomNav.tsx',
  'src/components/layout/MobileMoreMenu.tsx',
  'src/components/onboarding/OnboardingTour.tsx',
  'src/components/onboarding/WelcomeCard.tsx',
  'src/components/assets/BorrowAssetDialog.tsx'
];

filesToFix.forEach(replaceInFile);
console.log('Role fixing complete!');
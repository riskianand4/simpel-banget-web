import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, TrendingUp, AlertCircle, Clock, DollarSign, Activity, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEnhancedAssetManager } from '@/hooks/useEnhancedAssetManager';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { LoadingOverlay } from '@/components/ui/loading-states';
import { AssetTable } from '@/components/assets/AssetTable';
import { AddAssetDialog } from '@/components/assets/AddAssetDialog';
import { BorrowAssetDialog } from '@/components/assets/BorrowAssetDialog';
import { AssignPICDialog } from '@/components/assets/AssignPICDialog';
import { AssetDetailModal } from '@/components/assets/AssetDetailModal';
import { EditAssetDialog } from '@/components/assets/EditAssetDialog';
import { Asset } from '@/types/assets';

const AssetsPage = () => {
  // ALL HOOKS MUST BE CALLED AT THE TOP, BEFORE ANY CONDITIONAL LOGIC
  const {
    user,
    isAuthenticated
  } = useApp();

  const {
    assets,
    isLoading,
    addAsset,
    updateAsset,
    borrowAsset,
    returnAsset,
    deleteAsset,
    fetchAssets
  } = useEnhancedAssetManager();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [showAssignPICDialog, setShowAssignPICDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Load assets on initial mount
  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Calculate stats from assets
  const stats = React.useMemo(() => {
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
    const availableAssets = assets.filter(a => a.status === 'available').length;
    const borrowedAssets = assets.filter(a => a.status === 'borrowed').length;
    const maintenanceAssets = assets.filter(a => a.status === 'maintenance').length;
    return {
      totalAssets,
      totalValue,
      availableAssets,
      borrowedAssets,
      maintenanceAssets
    };
  }, [assets]);

  // Get overdue assets (assets that should have been returned)
  const overdueAssets = React.useMemo(() => {
    return assets.filter(asset => {
      return asset.status === 'borrowed' && asset.borrowedBy?.expectedReturnDate && new Date(asset.borrowedBy.expectedReturnDate) < new Date();
    });
  }, [assets]);

  // CONDITIONAL LOGIC AND EARLY RETURNS ONLY AFTER ALL HOOKS
  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  const canEdit = user.role === 'superadmin';

  const handleBorrowAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowBorrowDialog(true);
  };

  const handleAssignPIC = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssignPICDialog(true);
  };

  const assignPIC = async (assetId: string, picId: string, picName: string) => {
    try {
      await updateAsset(assetId, {
        picId,
        picName
      });
    } catch (error) {
      console.error('Failed to assign PIC:', error);
    }
  };

  const handleReturnAsset = async (asset: Asset) => {
    await returnAsset(asset.id);
  };

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowEditDialog(true);
  };

  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  const exportToExcel = () => {
    const exportData = assets.map(asset => ({
      'Kode Asset': asset.code,
      'Nama Asset': asset.name,
      'Kategori': asset.category,
      'Jumlah': asset.quantity,
      'Status': asset.status,
      'Kondisi': asset.condition,
      'PIC': asset.picName || '',
      'Lokasi': asset.location,
      'Harga Beli': asset.purchasePrice,
      'Tanggal Beli': asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('id-ID') : '',
      'Deskripsi': asset.description || '',
      'Dipinjam Oleh': asset.borrowedBy?.userName || '',
      'Tanggal Pinjam': asset.borrowedBy?.borrowDate ? new Date(asset.borrowedBy.borrowDate).toLocaleDateString('id-ID') : '',
      'Target Kembali': asset.borrowedBy?.expectedReturnDate ? new Date(asset.borrowedBy.expectedReturnDate).toLocaleDateString('id-ID') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Assets');

    // Auto-size columns
    const colWidths = [
      { wch: 12 }, // Kode Asset
      { wch: 25 }, // Nama Asset
      { wch: 15 }, // Kategori
      { wch: 8 },  // Jumlah
      { wch: 12 }, // Status
      { wch: 12 }, // Kondisi
      { wch: 20 }, // PIC
      { wch: 15 }, // Lokasi
      { wch: 15 }, // Harga Beli
      { wch: 12 }, // Tanggal Beli
      { wch: 30 }, // Deskripsi
      { wch: 20 }, // Dipinjam Oleh
      { wch: 12 }, // Tanggal Pinjam
      { wch: 12 }  // Target Kembali
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `data-assets-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className="w-full max-w-none overflow-x-hidden space-y-4 sm:space-y-6  sm:p-6 pb-16 sm:pb-20">
          <LoadingOverlay show={isLoading} text="Memuat aset..." />
          
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Manajemen Aset</h1>
                <p className="text-sm text-muted-foreground">Kelola dan pantau semua aset perusahaan</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={exportToExcel} variant="outline" className="glass w-full sm:w-auto" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export Excel</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                {canEdit && (
                  <Button onClick={() => setShowAddDialog(true)} className="glass w-full sm:w-auto" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Tambah Aset</span>
                    <span className="sm:hidden">Tambah</span>
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-1">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Aset</CardTitle>
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-2 sm:pb-3">
                  <div className="text-base sm:text-xl lg:text-2xl font-bold">{stats.totalAssets}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total item
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-1">
                  <CardTitle className="text-xs sm:text-sm font-medium">Nilai Total</CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-2 sm:pb-3">
                  <div className="text-base sm:text-xl lg:text-2xl font-bold">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      notation: 'compact'
                    }).format(stats.totalValue)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total nilai
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-1">
                  <CardTitle className="text-xs sm:text-sm font-medium">Tersedia</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-2 sm:pb-3">
                  <div className="text-base sm:text-xl lg:text-2xl font-bold text-success">{stats.availableAssets}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Siap pakai
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-1">
                  <CardTitle className="text-xs sm:text-sm font-medium">Dipinjam</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-2 sm:pb-3">
                  <div className="text-base sm:text-xl lg:text-2xl font-bold text-warning">{stats.borrowedAssets}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Sedang pakai
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Alerts */}
            {overdueAssets.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="glass border-warning/20 bg-warning/5">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-warning text-sm sm:text-base">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      Peringatan Keterlambatan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      Ada {overdueAssets.length} aset yang terlambat dikembalikan:
                    </p>
                    <div className="space-y-2">
                      {overdueAssets.slice(0, 3).map(asset => (
                        <div key={asset.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-background/50 rounded gap-2">
                          <div className="min-w-0">
                            <span className="font-medium text-sm">{asset.name}</span>
                            <span className="text-xs text-muted-foreground block sm:inline sm:ml-2">
                              Dipinjam oleh {asset.borrowedBy?.userName}
                            </span>
                          </div>
                          <Badge variant="destructive" className="text-xs self-start sm:self-center">
                            Terlambat {Math.ceil((new Date().getTime() - new Date(asset.borrowedBy?.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24))} hari
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {overdueAssets.length > 3 && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        Dan {overdueAssets.length - 3} aset lainnya...
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Assets Table */}
            <motion.div variants={itemVariants} className="overflow-x-auto">
              <AssetTable 
                assets={assets} 
                onEdit={canEdit ? handleEdit : undefined} 
                onDelete={canEdit ? deleteAsset : undefined} 
                onAssignPIC={user.role === 'superadmin' ? handleAssignPIC : undefined} 
                onBorrow={canEdit ? handleBorrowAsset : undefined} 
                onReturn={canEdit ? handleReturnAsset : undefined} 
                onViewDetails={handleViewDetails} 
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Dialogs */}
        <AddAssetDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog} 
          onSave={addAsset} 
          loading={isLoading} 
        />

        <BorrowAssetDialog 
          open={showBorrowDialog} 
          onOpenChange={setShowBorrowDialog} 
          asset={selectedAsset} 
          onBorrow={borrowAsset} 
          loading={isLoading} 
        />

        <AssignPICDialog 
          open={showAssignPICDialog} 
          onOpenChange={setShowAssignPICDialog} 
          asset={selectedAsset} 
          onAssign={assignPIC} 
          loading={isLoading} 
        />

        <AssetDetailModal 
          asset={selectedAsset} 
          open={showDetailModal} 
          onOpenChange={setShowDetailModal} 
        />

        <EditAssetDialog 
          asset={selectedAsset} 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog} 
          onSave={updateAsset} 
          loading={isLoading} 
        />
      </MainLayout>
    </ErrorBoundary>
  );
};

export default AssetsPage;
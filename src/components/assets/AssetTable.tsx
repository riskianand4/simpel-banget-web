import React, { useState } from 'react';
import { Asset } from '@/types/assets';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Search,
  Filter,
  Edit,
  Trash2,
  UserPlus,
  ExternalLink,
  RotateCcw,
  Package,
  TrendingUp,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface AssetTableProps {
  assets: Asset[];
  onEdit?: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
  onAssignPIC?: (asset: Asset) => void;
  onBorrow?: (asset: Asset) => void;
  onReturn?: (asset: Asset) => void;
  onViewDetails?: (asset: Asset) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onEdit,
  onDelete,
  onAssignPIC,
  onBorrow,
  onReturn,
  onViewDetails,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filter assets based on search and filters
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.picName && asset.picName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: Asset['status']) => {
    const variants = {
      available: 'bg-success/10 text-success border-success/20',
      borrowed: 'bg-warning/10 text-warning border-warning/20',
      maintenance: 'bg-destructive/10 text-destructive border-destructive/20',
      damaged: 'bg-muted text-muted-foreground border-muted/50'
    };

    const labels = {
      available: 'Tersedia',
      borrowed: 'Dipinjam',
      maintenance: 'Maintenance',
      damaged: 'Rusak'
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getConditionBadge = (condition: Asset['condition']) => {
    const variants = {
      excellent: 'bg-success/10 text-success border-success/20',
      good: 'bg-success/10 text-success border-success/20',
      fair: 'bg-warning/10 text-warning border-warning/20',
      poor: 'bg-destructive/10 text-destructive border-destructive/20'
    };

    const labels = {
      excellent: 'Sangat Baik',
      good: 'Baik',
      fair: 'Cukup',
      poor: 'Buruk'
    };

    return (
      <Badge variant="outline" className={variants[condition]}>
        {labels[condition]}
      </Badge>
    );
  };

  const canEdit = user?.role === 'superadmin';
  const canAssignPIC = user?.role === 'superadmin';

  const uniqueCategories = [...new Set(assets.map(asset => asset.category))];

  const handleViewDetail = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailDialogOpen(true);
  };

  const exportToExcel = () => {
    const exportData = filteredAssets.map(asset => ({
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
    <Card className="glass">
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="borrowed">Dipinjam</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="damaged">Rusak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="max-h-[calc(100vh)] overflow-x-auto overflow-y-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                <TableRow>
                  <TableHead className="w-[120px]">Kode</TableHead>
                  <TableHead className="w-[180px]">Nama</TableHead>
                  <TableHead className="w-[100px]">Kategori</TableHead>
                  <TableHead className="w-[80px]">Jumlah</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[90px]">Kondisi</TableHead>
                  <TableHead className="w-[120px]">PIC</TableHead>
                  <TableHead className="w-[100px]">Lokasi</TableHead>
                  <TableHead className="w-[100px]">Harga</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Tidak ada asset yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50 transition-colors h-[70px]" onClick={() => handleViewDetail(asset)}>
                      <TableCell className="font-medium w-[120px]">
                        <div className="truncate text-xs" title={asset.code}>{asset.code}</div>
                      </TableCell>
                      <TableCell className="w-[180px]">
                        <div className="truncate text-xs font-medium" title={asset.name}>{asset.name}</div>
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <div className="truncate text-xs" title={asset.category}>{asset.category}</div>
                      </TableCell>
                      <TableCell className="w-[80px]">
                        <div className="text-xs font-medium">{asset.quantity}</div>
                      </TableCell>
                      <TableCell className="w-[90px]">{getStatusBadge(asset.status)}</TableCell>
                      <TableCell className="w-[90px] truncate text-center">{getConditionBadge(asset.condition)}</TableCell>
                      <TableCell className="w-[120px]">
                        {asset.picName ? (
                          <span className="text-xs truncate block" title={asset.picName}>{asset.picName}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground w-[100px]">
                        <div className="truncate" title={asset.location}>{asset.location}</div>
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <div className="text-xs truncate">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            notation: 'compact'
                          }).format(asset.purchasePrice)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right w-[80px]">
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border-border shadow-lg z-50">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              
                              <DropdownMenuItem onClick={() => handleViewDetail(asset)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Detail
                              </DropdownMenuItem>

                              {canEdit && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onEdit?.(asset)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>

                                  {canAssignPIC && (
                                    <DropdownMenuItem onClick={() => onAssignPIC?.(asset)}>
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Tugaskan PIC
                                    </DropdownMenuItem>
                                  )}

                                  {asset.status === 'available' && asset.picId && (
                                    <DropdownMenuItem onClick={() => onBorrow?.(asset)}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Pinjam Asset
                                    </DropdownMenuItem>
                                  )}

                                  {asset.status === 'borrowed' && (
                                    <DropdownMenuItem onClick={() => onReturn?.(asset)}>
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Kembalikan Asset
                                    </DropdownMenuItem>
                                  )}

                                  {asset.status !== 'borrowed' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => setDeleteAssetId(asset.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Asset</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus asset ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteAssetId) {
                    onDelete?.(deleteAssetId);
                    setDeleteAssetId(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Detail Modal */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Asset</DialogTitle>
              <DialogDescription>
                Informasi lengkap asset
              </DialogDescription>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-6">
                {/* Asset Overview */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Informasi Asset
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kode Asset</label>
                      <p className="text-sm font-medium bg-background rounded px-2 py-1 border">{selectedAsset.code}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama Asset</label>
                      <p className="text-sm font-medium bg-background rounded px-2 py-1 border">{selectedAsset.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategori</label>
                      <p className="text-sm bg-background rounded px-2 py-1 border">{selectedAsset.category}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lokasi</label>
                      <p className="text-sm bg-background rounded px-2 py-1 border">{selectedAsset.location}</p>
                    </div>
                  </div>
                </div>
                
                {/* Status & Condition */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Status & Kondisi
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedAsset.status)}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kondisi</label>
                      <div className="mt-1">{getConditionBadge(selectedAsset.condition)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Informasi Finansial
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Harga Pembelian</label>
                      <p className="text-sm font-medium bg-background rounded px-2 py-1 border">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format(selectedAsset.purchasePrice)}
                      </p>
                    </div>
                    {selectedAsset.purchaseDate && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tanggal Pembelian</label>
                        <p className="text-sm bg-background rounded px-2 py-1 border">
                          {format(new Date(selectedAsset.purchaseDate), 'dd MMM yyyy', { locale: id })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* PIC & Management Information */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Informasi Pengelolaan
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PIC</label>
                      <p className="text-sm bg-background rounded px-2 py-1 border">
                        {selectedAsset.picName || 'Belum Ditugaskan'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dibuat Pada</label>
                      <p className="text-sm bg-background rounded px-2 py-1 border">
                        {format(new Date(selectedAsset.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {selectedAsset.description && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                      Deskripsi
                    </h4>
                    <p className="text-sm bg-background rounded px-3 py-2 border min-h-[3rem] flex items-start">
                      {selectedAsset.description}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                    Tutup
                  </Button>
                  {canEdit && (
                    <Button onClick={() => {
                      onEdit?.(selectedAsset);
                      setDetailDialogOpen(false);
                    }}>
                      Edit Asset
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
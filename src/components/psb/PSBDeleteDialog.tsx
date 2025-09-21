import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle } from 'lucide-react';
import { PSBOrder } from '@/types/psb';

interface PSBDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PSBOrder | null;
  onConfirm: (id: string) => Promise<void>;
}

export function PSBDeleteDialog({ open, onOpenChange, order, onConfirm }: PSBDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!order) return;

    try {
      setLoading(true);
      await onConfirm(order._id);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Completed': 'default',
      'In Progress': 'secondary',
      'Pending': 'outline',
      'Cancelled': 'destructive'
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  if (!order) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Konfirmasi Hapus Order
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Apakah Anda yakin ingin menghapus order PSB berikut? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Order #{order.no}</span>
                <Badge variant={getStatusBadge(order.status) as any}>
                  {order.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Order Number:</strong> {order.orderNo}</p>
                <p><strong>Pelanggan:</strong> {order.customerName}</p>
                <p><strong>Cluster:</strong> {order.cluster}</p>
                <p><strong>STO:</strong> {order.sto}</p>
                <p><strong>Paket:</strong> {order.package}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Peringatan:</p>
                <p className="text-destructive/80">
                  Data yang dihapus tidak dapat dipulihkan. Pastikan Anda telah membackup data jika diperlukan.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Order
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
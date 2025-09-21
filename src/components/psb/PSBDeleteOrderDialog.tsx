import React, { useState } from "react";
import { PSBOrder } from "@/types/psb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PSBDeleteOrderDialogProps {
  order: PSBOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const PSBDeleteOrderDialog: React.FC<PSBDeleteOrderDialogProps> = ({
  order,
  isOpen,
  onClose,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete(order._id);
      onClose();
    } catch (error) {
      console.error("Error deleting PSB order:", error);
      toast.error("Gagal menghapus data PSB");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Konfirmasi Hapus Data PSB
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Apakah Anda yakin ingin menghapus data PSB berikut?</p>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Order:</span>
                  <span className="font-mono">#{order.orderNo}</span>

                  <span className="font-medium">Pelanggan:</span>
                  <span>{order.customerName}</span>

                  <span className="font-medium">Telepon:</span>
                  <span>{order.customerPhone}</span>

                  <span className="font-medium">Status:</span>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium w-fit
    ${
      order.status === "Completed"
        ? " text-green-400 border border-green-600/30"
        : order.status === "In Progress"
        ? " text-blue-400 border border-blue-600/30"
        : order.status === "Pending"
        ? " text-yellow-400 border border-yellow-600/30"
        : " text-red-400 border border-red-600/30"
    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <p className="text-destructive font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan. Data yang sudah dihapus
                tidak dapat dikembalikan.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Ya, Hapus Data
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

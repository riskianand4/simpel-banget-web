import React from 'react';
import { PSBOrder } from '@/types/psb';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  MapPin, 
  Building2, 
  Phone, 
  Calendar,
  User,
  FileText,
  Hash,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PSBOrderDetailModalProps {
  order: PSBOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PSBOrderDetailModal: React.FC<PSBOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy, HH:mm', { locale: id });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <span className="text-xl">Detail Order PSB</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                #{order.orderNo}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{order.customerName}</h2>
              <p className="text-sm text-muted-foreground mt-1">Order #{order.orderNo}</p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>

          {/* Customer & Contact Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-primary" />
                Informasi Pelanggan
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nama Pelanggan
                  </label>
                  <p className="text-sm font-semibold bg-background rounded px-3 py-2 border border-border">
                    {order.customerName}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nomor Telepon
                  </label>
                  <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{order.customerPhone}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Alamat Lengkap
                  </label>
                  <div className="bg-background rounded px-3 py-2 border border-border">
                    <p className="text-sm text-foreground">{order.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service & Technical Information */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
                <Settings className="w-5 h-5 mr-2 text-primary" />
                Informasi Layanan
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Paket Layanan
                  </label>
                  <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{order.package}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cluster
                  </label>
                  <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{order.cluster}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    STO
                  </label>
                  <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{order.sto}</span>
                  </div>
                </div>
                
                {order.technician && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Teknisi
                    </label>
                    <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{order.technician}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center mb-3">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Catatan
              </h3>
              <p className="text-sm text-muted-foreground bg-background rounded px-3 py-2 border border-border">
                {order.notes}
              </p>
            </div>
          )}

          {/* Order Information */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
              <Hash className="w-5 h-5 mr-2 text-primary" />
              Informasi Order
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Nomor Order
                </label>
                <p className="text-sm font-mono bg-background rounded px-3 py-2 border border-border">
                  {order.orderNo}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tanggal Order
                </label>
                <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(order.date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Dibuat: {formatDate(order.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Diperbarui: {formatDate(order.updatedAt)}</span>
            </div>
          </div>

          {/* Created By */}
          {order.createdBy && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Dibuat oleh: </span>
              <span className="font-medium">{order.createdBy.name}</span>
              <span className="text-muted-foreground"> ({order.createdBy.email})</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, UserIcon, PhoneIcon, MapPinIcon, PackageIcon, UserCheckIcon, FileTextIcon, ClockIcon } from 'lucide-react';
import { PSBOrder } from '@/types/psb';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PSBViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PSBOrder | null;
}

export function PSBViewDialog({ open, onOpenChange, order }: PSBViewDialogProps) {
  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      'Completed': 'default',
      'In Progress': 'secondary', 
      'Pending': 'outline',
      'Cancelled': 'destructive'
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Detail Order PSB #{order.no}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Order Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadge(order.status) as any} className="mt-1">
                    {order.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {order.orderNo}
                  </code>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="text-sm font-medium">
                      {format(new Date(order.date), 'PPP', { locale: id })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dibuat</p>
                    <p className="text-sm font-medium">
                      {format(new Date(order.createdAt), 'PPp', { locale: id })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Informasi Pelanggan
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Pelanggan</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Telepon</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Alamat</p>
                    <p className="font-medium">{order.address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <PackageIcon className="h-4 w-4" />
                Detail Layanan
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cluster</p>
                  <Badge variant="outline" className="mt-1">{order.cluster}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">STO</p>
                  <p className="font-medium">{order.sto}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Paket Layanan</p>
                  <p className="font-medium">{order.package}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserCheckIcon className="h-4 w-4" />
                Informasi Teknis
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Teknisi</p>
                  <p className="font-medium">{order.technician || 'Belum ditugaskan'}</p>
                </div>
                {order.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Catatan</p>
                    <p className="font-medium text-sm bg-muted p-3 rounded-md">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Log Aktivitas</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Order dibuat oleh {order.createdBy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), 'PPp', { locale: id })}
                    </p>
                  </div>
                </div>
                {order.updatedBy && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Terakhir diupdate oleh {order.updatedBy.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.updatedAt), 'PPp', { locale: id })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
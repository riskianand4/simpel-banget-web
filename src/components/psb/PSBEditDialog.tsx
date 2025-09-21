import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Save, X, Edit } from 'lucide-react';
import { PSBOrder, CreatePSBOrderRequest } from '@/types/psb';
import { toast } from 'sonner';

interface PSBEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PSBOrder | null;
  onSave: (id: string, data: Partial<CreatePSBOrderRequest>) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const PACKAGE_OPTIONS = [
  'Indihome 20 Mbps',
  'Indihome 30 Mbps', 
  'Indihome 50 Mbps',
  'Indihome 100 Mbps',
  'IndiHome Gamer 50 Mbps',
  'IndiHome Gamer 100 Mbps'
];

export function PSBEditDialog({ open, onOpenChange, order, onSave }: PSBEditDialogProps) {
  const [formData, setFormData] = useState<Partial<CreatePSBOrderRequest>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        cluster: order.cluster,
        sto: order.sto,
        orderNo: order.orderNo,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        package: order.package,
        status: order.status,
        technician: order.technician || '',
        notes: order.notes || ''
      });
    }
  }, [order]);

  const handleInputChange = (field: keyof CreatePSBOrderRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!order) return;

    if (!formData.customerName || !formData.customerPhone || !formData.address) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      setLoading(true);
      await onSave(order._id, formData);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Order PSB #{order.no}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {order.orderNo}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status Saat Ini</p>
                  <Badge variant={getStatusBadge(order.status) as any} className="mt-1">
                    {order.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cluster */}
            <div className="space-y-2">
              <Label htmlFor="cluster">Cluster <span className="text-red-500">*</span></Label>
              <Input
                id="cluster"
                value={formData.cluster || ''}
                onChange={(e) => handleInputChange('cluster', e.target.value)}
                placeholder="Masukkan nama cluster"
              />
            </div>

            {/* STO */}
            <div className="space-y-2">
              <Label htmlFor="sto">STO <span className="text-red-500">*</span></Label>
              <Input
                id="sto"
                value={formData.sto || ''}
                onChange={(e) => handleInputChange('sto', e.target.value)}
                placeholder="Masukkan nama STO"
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Nama Pelanggan <span className="text-red-500">*</span></Label>
              <Input
                id="customerName"
                value={formData.customerName || ''}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Masukkan nama pelanggan"
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Nomor Telepon <span className="text-red-500">*</span></Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone || ''}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Masukkan nomor telepon"
              />
            </div>

            {/* Package */}
            <div className="space-y-2">
              <Label>Paket <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.package || ''} 
                onValueChange={(value) => handleInputChange('package', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_OPTIONS.map(pkg => (
                    <SelectItem key={pkg} value={pkg}>
                      {pkg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status || ''} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Technician */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="technician">Teknisi</Label>
              <Input
                id="technician"
                value={formData.technician || ''}
                onChange={(e) => handleInputChange('technician', e.target.value)}
                placeholder="Masukkan nama teknisi"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Alamat <span className="text-red-500">*</span></Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Masukkan alamat lengkap pelanggan"
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
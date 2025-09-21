import React, { useState, useEffect } from 'react';
import { PSBOrder, CreatePSBOrderRequest } from '@/types/psb';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const PACKAGE_OPTIONS = [
  'Indihome 20 Mbps',
  'Indihome 30 Mbps', 
  'Indihome 50 Mbps',
  'Indihome 100 Mbps',
  'IndiHome Gamer 50 Mbps',
  'IndiHome Gamer 100 Mbps'
];

interface PSBEditOrderDialogProps {
  order: PSBOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<CreatePSBOrderRequest>) => Promise<void>;
}

export const PSBEditOrderDialog: React.FC<PSBEditOrderDialogProps> = ({
  order,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<CreatePSBOrderRequest>({
    cluster: '',
    sto: '',
    orderNo: '',
    customerName: '',
    customerPhone: '',
    address: '',
    package: '',
    status: 'Pending',
    technician: '',
    notes: ''
  });
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Update form data when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        cluster: order.cluster || '',
        sto: order.sto || '',
        orderNo: order.orderNo || '',
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        address: order.address || '',
        package: order.package || '',
        status: order.status || 'Pending',
        technician: order.technician || '',
        notes: order.notes || ''
      });
      setDate(new Date(order.date));
    }
  }, [order]);

  if (!order) return null;

  const handleInputChange = (field: keyof CreatePSBOrderRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cluster || !formData.sto || !formData.orderNo || 
        !formData.customerName || !formData.customerPhone || 
        !formData.address || !formData.package) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      setLoading(true);
      await onUpdate(order._id, formData);
      toast.success('Data PSB berhasil diperbarui!');
      onClose();
    } catch (error) {
      console.error('Error updating PSB order:', error);
      toast.error('Gagal memperbarui data PSB');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (order) {
      setFormData({
        cluster: order.cluster || '',
        sto: order.sto || '',
        orderNo: order.orderNo || '',
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        address: order.address || '',
        package: order.package || '',
        status: order.status || 'Pending',
        technician: order.technician || '',
        notes: order.notes || ''
      });
      setDate(new Date(order.date));
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit Data PSB - #{order.orderNo}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Tanggal <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={(date) => date && setDate(date)} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Cluster */}
            <div className="space-y-2">
              <Label htmlFor="cluster" className="text-sm font-medium">
                Cluster <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="cluster"
                value={formData.cluster}
                onChange={(e) => handleInputChange('cluster', e.target.value)}
                placeholder="Masukkan nama cluster"
                className="h-10"
                required 
              />
            </div>

            {/* STO */}
            <div className="space-y-2">
              <Label htmlFor="sto" className="text-sm font-medium">
                STO <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="sto"
                value={formData.sto}
                onChange={(e) => handleInputChange('sto', e.target.value)}
                placeholder="Masukkan nama STO"
                className="h-10"
                required 
              />
            </div>

            {/* Order Number */}
            <div className="space-y-2">
              <Label htmlFor="orderNo" className="text-sm font-medium">
                Nomor Order <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="orderNo"
                value={formData.orderNo}
                onChange={(e) => handleInputChange('orderNo', e.target.value)}
                placeholder="Masukkan nomor order"
                className="h-10"
                required 
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium">
                Nama Pelanggan <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Masukkan nama pelanggan"
                className="h-10"
                required 
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-sm font-medium">
                Nomor Telepon <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Masukkan nomor telepon"
                className="h-10"
                required 
              />
            </div>

            {/* Package */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Paket <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.package} onValueChange={(value) => handleInputChange('package', value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_OPTIONS.map((pkg) => (
                    <SelectItem key={pkg} value={pkg}>
                      {pkg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Technician */}
            <div className="space-y-2">
              <Label htmlFor="technician" className="text-sm font-medium">Teknisi</Label>
              <Input 
                id="technician"
                value={formData.technician}
                onChange={(e) => handleInputChange('technician', e.target.value)}
                placeholder="Masukkan nama teknisi"
                className="h-10"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Alamat <span className="text-destructive">*</span>
            </Label>
            <Textarea 
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Masukkan alamat lengkap pelanggan"
              rows={3}
              className="resize-none"
              required 
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Catatan</Label>
            <Textarea 
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
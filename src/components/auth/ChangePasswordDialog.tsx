import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/apiClient';
import { PasswordStrength } from '@/components/ui/password-strength';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Semua field wajib diisi');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('Password baru harus berbeda dari password lama');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put('/api/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        toast.success('Password berhasil diubah');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        onOpenChange(false);
      } else {
        toast.error(response.error || 'Gagal mengubah password');
      }
    } catch (error) {
      // Change password error
      toast.error('Terjadi kesalahan saat mengubah password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswords({ current: false, new: false, confirm: false });
    onOpenChange(false);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Lock className="w-4 h-4 md:w-5 md:h-5" />
            Ubah Password
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Masukkan password lama dan password baru untuk mengubah password Anda
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="currentPassword" className="text-xs md:text-sm">Password Lama *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Masukkan password lama"
                className="pr-10 text-sm"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="newPassword" className="text-xs md:text-sm">Password Baru *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Masukkan password baru (min. 8 karakter)"
                className="pr-10 text-sm"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </Button>
            </div>
            <PasswordStrength 
              password={formData.newPassword} 
              showMeter={!!formData.newPassword}
              showRequirements={!!formData.newPassword}
              className="mt-1.5 md:mt-2"
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs md:text-sm">Konfirmasi Password Baru *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Ulangi password baru"
                className="pr-10 text-sm"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2 md:pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="w-full sm:w-auto text-sm"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto text-sm"
            >
              {isLoading ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
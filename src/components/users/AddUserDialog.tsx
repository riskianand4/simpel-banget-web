import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Check, ChevronsUpDown, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { PasswordStrength, generateSecurePassword, validateEmail, validateIndonesianPhone } from '@/components/ui/password-strength';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserManager } from '@/hooks/useUserManager';
import { ApiClientError } from '@/services/apiClient';
import { EmailVerificationDialog } from '@/components/auth/EmailVerificationDialog';

interface AddUserDialogProps {
  departments: string[];
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({ departments }) => {
  const { createUser } = useUserManager();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showVerification, setShowVerification] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<{email: string; name: string} | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'superadmin',
    department: '',
    position: '',
    password: ''
  });

  // Format department name (capitalize first letter of each word)
  const formatDepartmentName = (name: string): string => {
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept =>
    dept.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const handleDepartmentSelect = (value: string) => {
    if (value === '__new__') {
      // User wants to add new department
      const newDept = formatDepartmentName(deptSearch);
      if (newDept && !departments.some(d => d.toLowerCase() === newDept.toLowerCase())) {
        setFormData(prev => ({ ...prev, department: newDept }));
      }
    } else {
      setFormData(prev => ({ ...prev, department: value }));
    }
    setDeptOpen(false);
    setDeptSearch('');
  };

  const generatePassword = () => {
    const newPassword = generateSecurePassword();
    setFormData(prev => ({ ...prev, password: newPassword }));
    toast.success('Password aman telah dibuat');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nama wajib diisi';
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message || 'Email tidak valid';
    }

    const phoneValidation = validateIndonesianPhone(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.message || 'Nomor telepon tidak valid';
    }

    if (!formData.password) {
      errors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Mohon perbaiki kesalahan pada form');
      return;
    }

    setIsLoading(true);
    try {
      const success = await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        position: formData.position,
        permissions: []
      });

      if (success) {
        // For now, always show verification dialog for new users
        if (success) {
          setPendingUserData({ email: formData.email, name: formData.name });
          setShowVerification(true);
          toast.success('User dibuat! Email verifikasi telah dikirim.');
        } else {
          setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'user',
            department: '',
            position: '',
            password: ''
          });
          setIsOpen(false);
          toast.success('User berhasil dibuat');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'Gagal membuat user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      department: '',
      position: '',
      password: ''
    });
    setDeptSearch('');
    setFormErrors({});
    setShowPassword(false);
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    setPendingUserData(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      department: '',
      position: '',
      password: ''
    });
    setIsOpen(false);
    toast.success('Akun user berhasil diaktifkan!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs sm:text-sm" size="sm">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Tambah User</span>
          <span className="xs:hidden">Tambah</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-xs sm:max-w-md lg:max-w-2xl mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">Tambah User Baru</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Buat akun user baru dengan role dan permission</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Nama Lengkap *</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Masukkan nama lengkap" 
                  className={`text-sm ${formErrors.name ? 'border-destructive' : ''}`}
                  required
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="user@telnet.co.id" 
                  className={`text-sm ${formErrors.email ? 'border-destructive' : ''}`}
                  required
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">No. Telepon</Label>
                <Input 
                  id="phone" 
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, phone: e.target.value }));
                    if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder="0812-3456-7890" 
                  className={`text-sm ${formErrors.phone ? 'border-destructive' : ''}`}
                />
                {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-xs sm:text-sm font-medium">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'user' | 'superadmin' }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department" className="text-xs sm:text-sm font-medium">Department</Label>
                <Popover open={deptOpen} onOpenChange={setDeptOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={deptOpen}
                      className="justify-between text-sm h-9"
                    >
                      <span className="truncate">
                        {formData.department || "Pilih department..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full sm:w-[300px] p-0 z-50">
                    <Command>
                      <CommandInput 
                        placeholder="Cari atau ketik department..." 
                        value={deptSearch}
                        onValueChange={setDeptSearch}
                        className="text-sm"
                      />
                      <CommandEmpty>
                        {deptSearch && (
                          <div className="p-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs sm:text-sm"
                              onClick={() => handleDepartmentSelect('__new__')}
                            >
                              <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Tambah "{formatDepartmentName(deptSearch)}"
                            </Button>
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredDepartments.map((dept, index) => (
                          <CommandItem
                            key={index}
                            value={dept}
                            onSelect={() => handleDepartmentSelect(dept)}
                            className="text-sm"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3 sm:h-4 sm:w-4",
                                formData.department === dept ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{dept}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position" className="text-xs sm:text-sm font-medium">Posisi</Label>
                <Input 
                  id="position" 
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Jabatan/posisi" 
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Password Sementara *</Label>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, password: e.target.value }));
                        if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Masukkan password sementara" 
                      className={`pr-10 text-sm ${formErrors.password ? 'border-destructive' : ''}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="px-2 sm:px-3"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                <div className="min-h-0">
                  <PasswordStrength password={formData.password} showMeter={!!formData.password} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-3 sm:pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                handleReset();
                setIsOpen(false);
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
            >
              {isLoading ? 'Membuat...' : 'Buat User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Email Verification Dialog */}
      {pendingUserData && (
        <EmailVerificationDialog
          open={showVerification}
          onOpenChange={setShowVerification}
          email={pendingUserData.email}
          type="user_creation"
          userName={pendingUserData.name}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </Dialog>
  );
};
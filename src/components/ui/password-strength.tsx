import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X, Shield, ShieldCheck } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showMeter?: boolean;
  showRequirements?: boolean;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ 
  password, 
  showMeter = true, 
  showRequirements = false,
  className = ""
}) => {
  const requirements = [
    { label: 'Minimal 8 karakter', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Mengandung huruf besar', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Mengandung huruf kecil', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Mengandung angka', test: (pwd: string) => /\d/.test(pwd) },
    { label: 'Mengandung karakter khusus', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  const passedRequirements = requirements.filter(req => req.test(password));
  const strength = passedRequirements.length;
  
  const getStrengthData = () => {
    switch (strength) {
      case 0:
      case 1:
        return { level: 'Sangat Lemah', percentage: 20, color: 'bg-destructive', icon: Shield };
      case 2:
        return { level: 'Lemah', percentage: 40, color: 'bg-orange-500', icon: Shield };
      case 3:
        return { level: 'Sedang', percentage: 60, color: 'bg-yellow-500', icon: Shield };
      case 4:
        return { level: 'Kuat', percentage: 80, color: 'bg-blue-500', icon: ShieldCheck };
      case 5:
        return { level: 'Sangat Kuat', percentage: 100, color: 'bg-green-500', icon: ShieldCheck };
      default:
        return { level: '', percentage: 0, color: 'bg-muted', icon: Shield };
    }
  };

  const { level, percentage, color, icon: Icon } = getStrengthData();

  if (!password && !showRequirements) return null;

  return (
    <div className={className}>
      {showMeter && password && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4" />
            <span>Kekuatan Password: <span className="font-medium">{level}</span></span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      )}
      
      {showRequirements && (
        <div className="space-y-2 mt-3">
          <div className="text-sm font-medium">Persyaratan Password:</div>
          <div className="space-y-1">
            {requirements.map((req, index) => {
              const passed = req.test(password);
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {passed ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={passed ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function to generate secure password
export const generateSecurePassword = (): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>';
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining positions (minimum 8 chars total)
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Email validation utility
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email) return { isValid: false, message: 'Email wajib diisi' };
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Format email tidak valid' };
  }
  
  // Check for common corporate domains
  const corporateDomains = ['telnet.co.id', 'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1];
  
  return { isValid: true };
};

// Indonesian phone number validation
export const validateIndonesianPhone = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone) return { isValid: true }; // Phone is optional
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Indonesian phone number patterns
  const patterns = [
    /^(\+62|62|0)8[1-9][0-9]{6,9}$/, // Mobile numbers
    /^(\+62|62|0)[2-9][0-9]{7,10}$/, // Landline numbers
  ];
  
  const formattedPhone = digitsOnly.startsWith('8') ? '0' + digitsOnly : digitsOnly;
  
  const isValid = patterns.some(pattern => pattern.test(formattedPhone));
  
  if (!isValid) {
    return { isValid: false, message: 'Format nomor telepon Indonesia tidak valid' };
  }
  
  return { isValid: true };
};
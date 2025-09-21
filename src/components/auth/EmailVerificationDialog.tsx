import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Clock, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { emailVerificationApi } from '@/services/emailVerificationApi';

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  type: 'user_creation' | 'email_change_old' | 'email_change_new' | 'password_change';
  onVerificationComplete?: () => void;
  userName?: string;
}

export const EmailVerificationDialog: React.FC<EmailVerificationDialogProps> = ({
  open,
  onOpenChange,
  email,
  type,
  onVerificationComplete,
  userName
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const getDialogTitle = () => {
    switch (type) {
      case 'user_creation':
        return 'Aktivasi Akun';
      case 'email_change_old':
        return 'Verifikasi Email Lama';
      case 'email_change_new':
        return 'Verifikasi Email Baru';
      case 'password_change':
        return 'Verifikasi Perubahan Password';
      default:
        return 'Verifikasi Email';
    }
  };

  const getDialogDescription = () => {
    switch (type) {
      case 'user_creation':
        return `Kode verifikasi telah dikirim ke ${email}. Masukkan kode untuk mengaktifkan akun Anda.`;
      case 'email_change_old':
        return `Masukkan kode verifikasi yang dikirim ke email lama Anda (${email}) untuk melanjutkan perubahan email.`;
      case 'email_change_new':
        return `Masukkan kode verifikasi yang dikirim ke email baru Anda (${email}) untuk menyelesaikan perubahan email.`;
      case 'password_change':
        return `Masukkan kode verifikasi yang dikirim ke ${email} untuk mengkonfirmasi perubahan password.`;
      default:
        return `Masukkan kode verifikasi yang dikirim ke ${email}.`;
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Kode verifikasi harus 6 digit');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await emailVerificationApi.verifyEmail(email, code, type);

      if (response.success) {
        toast.success(response.message || 'Verifikasi berhasil!');
        onVerificationComplete?.();
        onOpenChange(false);
        setCode('');
      } else {
        setError(response.message || 'Verifikasi gagal');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Verifikasi gagal. Silakan coba lagi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await emailVerificationApi.resendCode(email, type);

      if (response.success) {
        toast.success('Kode verifikasi telah dikirim ulang');
        setCountdown(120); // 2 minutes countdown
        setCode(''); // Clear current code
      } else {
        setError(response.message || 'Gagal mengirim ulang kode');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Gagal mengirim ulang kode verifikasi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numeric input and max 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !isLoading) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">{getDialogTitle()}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {userName && type === 'user_creation' && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Halo <strong>{userName}</strong>, akun Anda telah dibuat oleh admin. 
                Silakan verifikasi email untuk mengaktifkan akun.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="verification-code">Kode Verifikasi (6 digit)</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Masukkan 6-digit kode yang dikirim ke email Anda
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleVerify} 
              disabled={code.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verifikasi
            </Button>

            <Button 
              variant="outline" 
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim Ulang...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Kirim Ulang ({Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')})
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Kirim Ulang Kode
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Tips:</strong>
            </p>
            <ul className="mt-1 text-xs text-muted-foreground space-y-1">
              <li>• Kode berlaku selama 10 menit</li>
              <li>• Periksa folder spam jika tidak menerima email</li>
              <li>• Maksimal 3 kali percobaan per kode</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
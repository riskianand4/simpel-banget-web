import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Shield, 
  Globe, 
  Monitor, 
  Database,
  Activity
} from 'lucide-react';
import { AdminActivity } from '@/services/systemApi';

interface AuditLogDetailModalProps {
  log: AdminActivity | null;
  open: boolean;
  onClose: () => void;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, open, onClose }) => {
  if (!log) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Low Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDetails = (details: any) => {
    if (!details || typeof details !== 'object') {
      return 'Tidak ada detail tambahan';
    }

    // Filter out empty or undefined values
    const filteredDetails = Object.entries(details).filter(([key, value]) => 
      value !== undefined && value !== null && value !== ''
    );

    if (filteredDetails.length === 0) {
      return 'Tidak ada detail tambahan';
    }

    return filteredDetails.map(([key, value]) => (
      <div key={key} className="flex justify-between items-start py-2 border-b border-border/40 last:border-b-0">
        <span className="font-medium text-sm capitalize text-muted-foreground">
          {key.replace(/([A-Z])/g, ' $1').trim()}:
        </span>
        <span className="text-sm text-right max-w-[60%] break-words">
          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
        </span>
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Detail Log Audit
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang aktivitas administrator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tanggal:</span>
                  </div>
                  <p className="text-sm pl-6">
                    {format(new Date(log.timestamp), 'dd MMMM yyyy')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Waktu:</span>
                  </div>
                  <p className="text-sm pl-6 font-mono">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Admin:</span>
                  </div>
                  <p className="text-sm pl-6 font-medium">
                    {log.admin}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Lokasi:</span>
                  </div>
                  <p className="text-sm pl-6">
                    {log.location}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Aksi:</span>
                </div>
                <p className="text-sm pl-6 font-medium text-primary">
                  {log.action}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className={`h-4 w-4 ${getRiskColor(log.risk)}`} />
                  <span className="text-sm font-medium">Risk Level:</span>
                </div>
                <div className="pl-6">
                  {getRiskBadge(log.risk)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Informasi Teknis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">ID Log:</span>
                </div>
                <p className="text-sm pl-6 font-mono text-muted-foreground">
                  {log._id}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Timestamp:</span>
                </div>
                <p className="text-sm pl-6 font-mono text-muted-foreground">
                  {new Date(log.timestamp).toISOString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          {(log as any).details && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Detail Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {formatDetails((log as any).details)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Konteks Keamanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Analisis Risiko:</span> {' '}
                    {log.risk === 'high' && 'Aktivitas ini memiliki risiko tinggi dan memerlukan perhatian khusus.'}
                    {log.risk === 'medium' && 'Aktivitas ini memiliki risiko sedang dan perlu dipantau.'}
                    {log.risk === 'low' && 'Aktivitas ini memiliki risiko rendah dan merupakan operasi rutin.'}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>
                    Log ini disimpan secara permanen untuk keperluan audit dan keamanan.
                    Hanya superadmin yang dapat mengakses informasi detail ini.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailModal;
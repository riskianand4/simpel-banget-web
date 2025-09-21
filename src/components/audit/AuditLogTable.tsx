import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ModernCard from '@/components/enhanced/ModernCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Clock, Shield, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { AdminActivity } from '@/services/systemApi';

interface AuditLogTableProps {
  logs: AdminActivity[];
  loading: boolean;
  onViewDetail: (log: AdminActivity) => void;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, loading, onViewDetail }) => {
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

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('tambah')) {
      return '➕';
    }
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('hapus')) {
      return '🗑️';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
      return '✏️';
    }
    if (action.toLowerCase().includes('view') || action.toLowerCase().includes('access')) {
      return '👁️';
    }
    if (action.toLowerCase().includes('export')) {
      return '📤';
    }
    if (action.toLowerCase().includes('import')) {
      return '📥';
    }
    if (action.toLowerCase().includes('login')) {
      return '🔑';
    }
    return '📋';
  };

  if (loading) {
    return (
      <ModernCard variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground font-medium">Memuat log audit...</span>
            </div>
          </div>
        </CardContent>
      </ModernCard>
    );
  }

  if (logs.length === 0) {
    return (
      <ModernCard variant="gradient">
        <CardContent className="p-8">
          <div className="text-center py-8">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Shield className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Tidak Ada Log</h3>
            <p className="text-muted-foreground">
              Tidak ada log audit yang ditemukan dengan filter yang dipilih.
            </p>
          </div>
        </CardContent>
      </ModernCard>
    );
  }

  return (
    <ModernCard variant="default">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tanggal & Waktu
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Admin
                  </div>
                </TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lokasi
                  </div>
                </TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    <div className="space-y-1">
                      <div>{format(new Date(log.timestamp), 'dd/MM/yyyy')}</div>
                      <div className="text-muted-foreground text-xs">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{log.admin}</div>
                        <div className="text-xs text-muted-foreground">Administrator</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getActionIcon(log.action)}</span>
                      <span className="font-medium">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{log.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRiskBadge(log.risk)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(log)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </ModernCard>
  );
};

export default AuditLogTable;
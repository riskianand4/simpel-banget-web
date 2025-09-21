import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, UserActivity } from '@/types/users';
import { getRoleDisplayName, getRoleColorClass } from '@/services/roleMapper';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Calendar, 
  Activity, 
  Shield,
  Clock,
  MapPin
} from 'lucide-react';

interface UserDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activities?: UserActivity[];
  isLoadingActivities?: boolean;
  onFetchActivities?: (userId: string) => void;
}

export const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  isOpen,
  onClose,
  user,
  activities = [],
  isLoadingActivities = false,
  onFetchActivities
}) => {
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (isOpen && user && activeTab === 'activity' && onFetchActivities) {
      onFetchActivities(user.id);
    }
  }, [isOpen, user, activeTab, onFetchActivities]);

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-muted text-muted-foreground';
      case 'suspended': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPermissions = (permissions: any[]) => {
    if (!permissions || permissions.length === 0) {
      return 'No specific permissions';
    }
    return permissions.map(p => typeof p === 'string' ? p : p.action).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-background max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            Detail User: {user.name}
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap dan aktivitas user
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detail Info</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Informasi Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Nama:</span>
                    <span>{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Telepon:</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Bergabung:</span>
                    <span className="text-sm">{formatDate(user.createdAt)}</span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Login Terakhir:</span>
                      <span className="text-sm">{formatDate(user.lastLogin)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Organization Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Informasi Organisasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Department:</span>
                    <span>{user.department || 'Tidak ada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Posisi:</span>
                    <span>{user.position || 'Tidak ada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Role:</span>
                    <Badge className={getRoleColorClass(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Status:</span>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  User Permissions
                </CardTitle>
                <CardDescription>
                  Permissions dan hak akses yang dimiliki user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Role-based Access:</span>
                    <Badge className={`ml-2 ${getRoleColorClass(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="font-medium">Specific Permissions:</span>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {formatPermissions(user.permissions)}
                      </p>
                    </div>
                  </div>

                  {/* Role Description */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Role Description:</h4>
                    <p className="text-sm text-muted-foreground">
                      {user.role === 'superadmin' && 'Full system access, can manage all users, settings, and data.'}
                      {user.role === 'user' && 'Standard user access to basic features and personal data.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  User Activity Log
                </CardTitle>
                <CardDescription>
                  Riwayat aktivitas dan aksi yang dilakukan user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-12 bg-muted/50 rounded animate-pulse" />
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="text-sm">
                            {formatDate(activity.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{activity.action}</Badge>
                          </TableCell>
                          <TableCell>{activity.resource}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {activity.details}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Belum ada aktivitas yang tercatat</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
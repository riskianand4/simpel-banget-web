import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/types/users';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield, 
  Download, 
  Upload,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkUserActionsProps {
  selectedUsers: User[];
  onClearSelection: () => void;
  onBulkStatusUpdate: (userIds: string[], status: 'active' | 'inactive' | 'suspended') => Promise<boolean>;
  onBulkRoleUpdate: (userIds: string[], role: 'user' | 'admin' | 'superadmin') => Promise<boolean>;
  onBulkDelete: (userIds: string[]) => Promise<boolean>;
  onExportUsers: () => void;
  onImportUsers: () => void;
}

export const BulkUserActions: React.FC<BulkUserActionsProps> = ({
  selectedUsers,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkRoleUpdate,
  onBulkDelete,
  onExportUsers,
  onImportUsers
}) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'status' | 'role' | 'delete';
    value?: string;
    title: string;
    description: string;
    action: () => Promise<boolean>;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = async (action: typeof confirmAction) => {
    if (!action) return;

    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    setIsProcessing(true);
    try {
      const success = await confirmAction.action();
      if (success) {
        toast.success(`Bulk action completed for ${selectedUsers.length} users`);
        onClearSelection();
      }
    } finally {
      setIsProcessing(false);
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  const handleBulkStatusChange = (status: 'active' | 'inactive' | 'suspended') => {
    const userIds = selectedUsers.map(u => u.id);
    handleBulkAction({
      type: 'status',
      value: status,
      title: `Update Status to ${status}`,
      description: `Are you sure you want to change the status of ${selectedUsers.length} selected users to "${status}"?`,
      action: () => onBulkStatusUpdate(userIds, status)
    });
  };

  const handleBulkRoleChange = (role: 'user' | 'admin' | 'superadmin') => {
    const userIds = selectedUsers.map(u => u.id);
    handleBulkAction({
      type: 'role',
      value: role,
      title: `Update Role to ${role}`,
      description: `Are you sure you want to change the role of ${selectedUsers.length} selected users to "${role}"? This will affect their system permissions.`,
      action: () => onBulkRoleUpdate(userIds, role)
    });
  };

  const handleBulkDelete = () => {
    const userIds = selectedUsers.map(u => u.id);
    handleBulkAction({
      type: 'delete',
      title: 'Delete Selected Users',
      description: `Are you sure you want to permanently delete ${selectedUsers.length} selected users? This action cannot be undone.`,
      action: () => onBulkDelete(userIds)
    });
  };

  if (selectedUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Actions
          </CardTitle>
          <CardDescription>
            Select users to perform bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onExportUsers}>
              <Download className="w-4 h-4 mr-2" />
              Export All Users
            </Button>
            <Button variant="outline" onClick={onImportUsers}>
              <Upload className="w-4 h-4 mr-2" />
              Import Users
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Bulk Actions
            </span>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear Selection
            </Button>
          </CardTitle>
          <CardDescription>
            {selectedUsers.length} users selected for bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Users Preview */}
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="secondary" className="text-xs">
                  {user.name}
                </Badge>
              ))}
            </div>

            {/* Status Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Update Status:</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkStatusChange('active')}
                  className="text-success border-success hover:bg-success/10"
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Activate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkStatusChange('inactive')}
                  className="text-muted-foreground"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Deactivate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkStatusChange('suspended')}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Suspend
                </Button>
              </div>
            </div>

            {/* Role Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Update Role:</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkRoleChange('user')}
                >
                  <Shield className="w-4 h-4 mr-1" />
                  User
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkRoleChange('admin')}
                  className="text-warning border-warning hover:bg-warning/10"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Admin
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkRoleChange('superadmin')}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Super Admin
                </Button>
              </div>
            </div>

            {/* Dangerous Actions */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-sm font-medium text-destructive">Dangerous Actions:</h4>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected ({selectedUsers.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              {confirmAction?.title}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.description}
            </DialogDescription>
          </DialogHeader>

          {confirmAction?.type === 'delete' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Warning: This action is irreversible!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                All user data, including their activity history, will be permanently deleted.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckSquare, Square, Edit, Trash2, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { PSBOrder, CreatePSBOrderRequest } from '@/types/psb';
import { toast } from 'sonner';

interface BulkOperationsProps {
  orders: PSBOrder[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkUpdate: (ids: string[], updates: Partial<CreatePSBOrderRequest>) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  orders,
  selectedIds,
  onSelectionChange,
  onBulkUpdate,
  onBulkDelete
}) => {
  const [bulkEditDialog, setBulkEditDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [bulkUpdates, setBulkUpdates] = useState({
    status: '',
    technician: '',
    notes: ''
  });

  const isAllSelected = selectedIds.length === orders.length && orders.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < orders.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map(order => order._id));
    }
  };

  const handleBulkEdit = async () => {
    if (selectedIds.length === 0) {
      toast.error('No orders selected');
      return;
    }

    // Prepare updates object (only include non-empty values)
    const updates: Partial<CreatePSBOrderRequest> = {};
    if (bulkUpdates.status) updates.status = bulkUpdates.status;
    if (bulkUpdates.technician) updates.technician = bulkUpdates.technician;
    if (bulkUpdates.notes) updates.notes = bulkUpdates.notes;

    if (Object.keys(updates).length === 0) {
      toast.error('No changes specified');
      return;
    }

    try {
      setIsProcessing(true);
      await onBulkUpdate(selectedIds, updates);
      setBulkEditDialog(false);
      setBulkUpdates({ status: '', technician: '', notes: '' });
      onSelectionChange([]);
      toast.success(`Successfully updated ${selectedIds.length} orders`);
    } catch (error) {
      toast.error('Failed to update orders');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No orders selected');
      return;
    }

    try {
      setIsProcessing(true);
      await onBulkDelete(selectedIds);
      setBulkDeleteDialog(false);
      onSelectionChange([]);
      toast.success(`Successfully deleted ${selectedIds.length} orders`);
    } catch (error) {
      toast.error('Failed to delete orders');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orders.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-4">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            className="data-[state=checked]:bg-primary"
            data-indeterminate={isIndeterminate}
          />
          <Label className="text-sm font-medium">
            {selectedIds.length > 0 ? (
              <span>
                {selectedIds.length} of {orders.length} selected
              </span>
            ) : (
              'Select all'
            )}
          </Label>
        </div>

        {/* Selected Count Badge */}
        {selectedIds.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <CheckSquare className="h-3 w-3" />
            {selectedIds.length} selected
          </Badge>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2">
          {/* Bulk Edit */}
          <Dialog open={bulkEditDialog} onOpenChange={setBulkEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit ({selectedIds.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Edit Orders</DialogTitle>
                <DialogDescription>
                  Update multiple orders at once. Only filled fields will be updated.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedIds.length} orders will be updated
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="bulk-status">Status</Label>
                  <Select
                    value={bulkUpdates.status}
                    onValueChange={(value) => setBulkUpdates(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keep current status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keep current status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-technician">Technician</Label>
                  <Input
                    id="bulk-technician"
                    placeholder="Keep current technician"
                    value={bulkUpdates.technician}
                    onChange={(e) => setBulkUpdates(prev => ({ ...prev, technician: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-notes">Notes</Label>
                  <Textarea
                    id="bulk-notes"
                    placeholder="Add notes (will be appended)"
                    value={bulkUpdates.notes}
                    onChange={(e) => setBulkUpdates(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleBulkEdit} 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    Update Orders
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setBulkEditDialog(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Delete */}
          <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Multiple Orders</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. The selected orders will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{selectedIds.length} orders</strong> will be permanently deleted
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button 
                    variant="destructive" 
                    onClick={handleBulkDelete} 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Orders
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setBulkDeleteDialog(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};
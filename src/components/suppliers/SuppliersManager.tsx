import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, Phone, Mail, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supplierApi } from '@/services/supplierApi';
import { AddSupplierDialog } from './AddSupplierDialog';
import { EditSupplierDialog } from './EditSupplierDialog';
import { toast } from 'sonner';
import type { Supplier } from '@/types/orders';

export const SuppliersManager = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierApi.getSuppliers({
        search: searchTerm,
        limit: 50
      });
      
      if (response.success) {
        setSuppliers(response.data as Supplier[]);
      }
    } catch (error) {
      toast.error('Failed to load suppliers');
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [searchTerm]);

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      const response = await supplierApi.toggleSupplierStatus(supplier.id);
      if (response.success) {
        toast.success(`Supplier ${supplier.status === 'active' ? 'deactivated' : 'activated'}`);
        loadSuppliers();
      }
    } catch (error) {
      toast.error('Failed to toggle supplier status');
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await supplierApi.deleteSupplier(supplier.id);
      toast.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Suppliers</h2>
          <p className="text-muted-foreground">Manage your suppliers and vendors</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="font-medium">{supplier.name}</div>
                    {supplier.address && (
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {supplier.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-1" />
                        {supplier.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-3 h-3 mr-1" />
                        {supplier.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>{supplier.paymentTerms}</TableCell>
                  <TableCell>
                    <span title={`${supplier.rating}/5 stars`}>
                      {getRatingStars(supplier.rating)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{supplier.totalOrders} orders</div>
                      <div className="text-muted-foreground">
                        Rp {supplier.totalValue.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(supplier)}>
                          {supplier.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(supplier)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {suppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found. Add your first supplier to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <AddSupplierDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={loadSuppliers}
      />

      {editingSupplier && (
        <EditSupplierDialog 
          supplier={editingSupplier}
          open={!!editingSupplier}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
          onSuccess={loadSuppliers}
        />
      )}
    </div>
  );
};
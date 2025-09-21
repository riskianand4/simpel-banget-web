import React, { useMemo, useState, forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, MoreVertical, CheckCircle, Clock, AlertTriangle, Phone, MapPin, Package, User } from 'lucide-react';
import { PSBOrder } from '@/types/psb';
import { cn } from '@/lib/utils';

interface VirtualizedDataTableProps {
  orders: PSBOrder[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onView: (order: PSBOrder) => void;
  onEdit: (order: PSBOrder) => void;
  onDelete: (order: PSBOrder) => void;
  height?: number;
}

interface RowData {
  orders: PSBOrder[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onView: (order: PSBOrder) => void;
  onEdit: (order: PSBOrder) => void;
  onDelete: (order: PSBOrder) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'In Progress':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'Pending':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants = {
    'Completed': 'default',
    'In Progress': 'secondary', 
    'Pending': 'outline',
    'Cancelled': 'destructive'
  };
  return variants[status as keyof typeof variants] || 'outline';
};

const VirtualTableRow: React.FC<{ index: number; style: any; data: RowData }> = ({ 
  index, 
  style, 
  data: { orders, selectedIds, onSelectionChange, onView, onEdit, onDelete } 
}) => {
  const order = orders[index];
  const isSelected = selectedIds.includes(order._id);

  const handleSelection = (checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, order._id]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== order._id));
    }
  };

  return (
    <div style={style} className={cn(
      "flex items-center border-b border-border/50 hover:bg-muted/50 transition-colors",
      isSelected && "bg-primary/5"
    )}>
      {/* Mobile Layout */}
      <div className="md:hidden w-full p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelection}
            className="mt-1"
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{order.customerName}</div>
              <Badge variant={getStatusBadge(order.status) as any} className="text-xs">
                {order.status}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {order.cluster} / {order.sto}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {order.customerPhone}
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-3 w-3" />
                {order.package}
              </div>
              {order.technician && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {order.technician}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Order: {order.orderNo}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(order)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(order)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(order)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex w-full items-center px-4 py-3 text-sm">
        <div className="w-10 flex justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelection}
          />
        </div>
        
        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
          <div className="space-y-1">
            <div className="font-medium truncate">{order.customerName}</div>
            <div className="text-xs text-muted-foreground truncate">{order.orderNo}</div>
          </div>
          
          <div className="space-y-1">
            <div className="truncate">{order.cluster}</div>
            <div className="text-xs text-muted-foreground truncate">{order.sto}</div>
          </div>
          
          <div className="truncate">{order.customerPhone}</div>
          
          <div className="truncate">{order.package}</div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <Badge variant={getStatusBadge(order.status) as any} className="text-xs">
              {order.status}
            </Badge>
          </div>
          
          <div className="truncate text-xs">{order.technician || '-'}</div>
        </div>
        
        <div className="w-20 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(order)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(order)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(order)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export const VirtualizedDataTable: React.FC<VirtualizedDataTableProps> = ({
  orders,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  height = 600
}) => {
  const itemData: RowData = useMemo(() => ({
    orders,
    selectedIds,
    onSelectionChange,
    onView,
    onEdit,
    onDelete
  }), [orders, selectedIds, onSelectionChange, onView, onEdit, onDelete]);

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">No orders found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Orders ({orders.length})</CardTitle>
          <Badge variant="outline">{orders.length} records</Badge>
        </div>
        
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground border-b">
            <div className="w-10 flex justify-center">
              <span>Select</span>
            </div>
            <div className="flex-1 grid grid-cols-6 gap-4">
              <div>Customer / Order</div>
              <div>Location</div>
              <div>Phone</div>
              <div>Package</div>
              <div>Status</div>
              <div>Technician</div>
            </div>
            <div className="w-20 flex justify-end">Actions</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <List
          height={height}
          width="100%"
          itemCount={orders.length}
          itemSize={120} // Adjust based on mobile/desktop layout
          itemData={itemData}
          className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-background"
        >
          {VirtualTableRow}
        </List>
      </CardContent>
    </Card>
  );
};
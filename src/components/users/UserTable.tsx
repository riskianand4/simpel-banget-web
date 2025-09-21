import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, Lock, Unlock, MoreHorizontal, Activity } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User } from '@/types/users';
import { getRoleDisplayName, getRoleColorClass } from '@/services/roleMapper';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onViewActivity: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  onViewActivity
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-muted text-muted-foreground';
      case 'suspended': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatLastLogin = (lastLogin?: Date) => {
    if (!lastLogin) return 'Never';
    return lastLogin.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 bg-muted/50 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Tidak ada user yang ditemukan</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto overflow-y-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-medium">User</TableHead>
            <TableHead className="text-xs font-medium">Email</TableHead>
            <TableHead className="text-xs font-medium">Role</TableHead>
            <TableHead className="hidden md:table-cell text-xs font-medium">Department</TableHead>
            <TableHead className="text-xs font-medium">Status</TableHead>
            <TableHead className="hidden lg:table-cell text-xs font-medium">Last Login</TableHead>
            <TableHead className="text-xs font-medium w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50 h-12">
              <TableCell className="py-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 max-w-36">
                    <p className="font-medium text-foreground text-sm truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.position || 'No position'}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <span className="text-sm truncate block max-w-40">{user.email}</span>
              </TableCell>
              <TableCell className="py-2">
                <Badge className={`${getRoleColorClass(user.role)} text-xs px-2 py-1`}>
                  {getRoleDisplayName(user.role)}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell py-2">
                <span className="text-sm max-w-24 truncate block">{user.department || 'No department'}</span>
              </TableCell>
              <TableCell className="py-2">
                <Badge className={`${getStatusColor(user.status)} text-xs px-2 py-1`}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell py-2">
                <span className="text-xs text-muted-foreground">
                  {formatLastLogin(user.lastLogin)}
                </span>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex gap-1 items-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onView(user)}
                    title="View user details"
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEdit(user)}
                    title="Edit user"
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border shadow-md">
                      <DropdownMenuItem onClick={() => onViewActivity(user)}>
                        <Activity className="w-3 h-3 mr-2" />
                        View Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                        {user.status === 'active' ? (
                          <>
                            <Lock className="w-3 h-3 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
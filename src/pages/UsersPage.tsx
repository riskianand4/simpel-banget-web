import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Download, Upload, Users, UserCheck, 
  UserX, Shield, Activity, AlertTriangle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useUserManager } from '@/hooks/useUserManager';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { UserTable } from '@/components/users/UserTable';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { UserDetailDialog } from '@/components/users/UserDetailDialog';
import { BulkUserActions } from '@/components/users/BulkUserActions';
import { User } from '@/types/users';

export default function UsersPage() {
  const { user, isAuthenticated } = useApp();
  const { 
    users, 
    roles,
    isLoading: loading, 
    error,
    updateUser,
    toggleUserStatus,
    deleteUser: deleteUserAction,
    fetchUserActivity,
    activities
  } = useUserManager();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);

  // Only superadmin can access this page
  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }
  
  if (user?.role !== 'superadmin') {
    return (
      <ErrorBoundary>
        <MainLayout>
        <div className="flex items-center justify-center h-96 px-4">
          <div className="text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4 mx-auto" />
            <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-2">Akses Terbatas</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
          </div>
        </div>
      </MainLayout>
      </ErrorBoundary>
    );
  }


  const mockUserActivities = [];

  // Event handlers
  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setEditDialogOpen(true);
  };

  const handleViewUser = (user: User) => {
    setUserToView(user);
    setViewDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    const success = await toggleUserStatus(user.id);
    if (success) {
      toast.success(`User ${user.name} status updated successfully`);
    }
  };

  const handleViewActivity = (user: User) => {
    setUserToView(user);
    setViewDialogOpen(true);
    // Auto-switch to activity tab - will be handled in UserDetailDialog
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    const success = await deleteUserAction(userToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success(`User ${userToDelete.name} deleted successfully`);
    }
  };

  // Bulk operations
  const handleBulkStatusUpdate = async (userIds: string[], status: 'active' | 'inactive' | 'suspended'): Promise<boolean> => {
    let successCount = 0;
    for (const userId of userIds) {
      const success = await updateUser(userId, { status });
      if (success) successCount++;
    }
    return successCount === userIds.length;
  };

  const handleBulkRoleUpdate = async (userIds: string[], role: 'user' | 'superadmin'): Promise<boolean> => {
    let successCount = 0;
    for (const userId of userIds) {
      const success = await updateUser(userId, { role });
      if (success) successCount++;
    }
    return successCount === userIds.length;
  };

  const handleBulkDelete = async (userIds: string[]): Promise<boolean> => {
    let successCount = 0;
    for (const userId of userIds) {
      const success = await deleteUserAction(userId);
      if (success) successCount++;
    }
    return successCount === userIds.length;
  };

  const handleExportUsers = () => {
    // Implementation for CSV export
    toast.info('Export functionality coming soon');
  };

  const handleImportUsers = () => {
    // Implementation for CSV import
    toast.info('Import functionality coming soon');
  };

  const filteredUsers = users.filter(userData => {
    const matchesSearch = 
      userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || userData.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || userData.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || userData.department === selectedDepartment;
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const departments = Array.from(new Set(users.map(userData => userData.department).filter(dept => dept && dept.trim() !== '')));

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-destructive text-destructive-foreground';
      case 'admin': return 'bg-warning text-warning-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-muted text-muted-foreground';
      case 'suspended': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(userData => userData.status === 'active').length;
  const adminUsers = users.filter(userData => ['admin', 'superadmin'].includes(userData.role)).length;
  const recentActivities = mockUserActivities.slice(0, 10);

  return (
    <ErrorBoundary>
      <MainLayout>
      <div className="space-y-4 sm:space-y-6  sm:p-6 pb-16 sm:pb-6">
         {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">Manajemen User</h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Kelola user, role, dan permission sistem</p>
          </div>
          <div className="flex flex-row xs:flex-row gap-2 w-full sm:w-auto">
            <AddUserDialog departments={departments} />
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Export Data</span>
              <span className="xs:hidden">Export</span>
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Import Users</span>
              <span className="xs:hidden">Import</span>
            </Button>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm lg:text-base font-medium truncate">Total Users</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{totalUsers}</div>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">Semua user terdaftar</p>
            </CardContent>
          </Card>

          <Card className="bg-success/10 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm lg:text-base font-medium truncate">Active Users</CardTitle>
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-success flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-success">{activeUsers}</div>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">User aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-warning/10 border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm lg:text-base font-medium truncate">Admin Users</CardTitle>
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-warning flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-warning">{adminUsers}</div>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">Admin & super admin</p>
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-accent/20 ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm lg:text-base font-medium truncate">Departments</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-info flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-info">{departments.length}</div>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">Total department</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="flex flex-col gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
            <Input
              placeholder="Cari berdasarkan nama, email, atau department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 bg-muted/50 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full text-xs sm:text-sm col-span-1 xs:col-span-2 lg:col-span-1">
                <SelectValue placeholder="Semua Department" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="all">Semua Department</SelectItem>
                {departments.map((dept, index) => (
                  <SelectItem key={index} value={dept || 'unknown'}>{dept || 'Unknown Department'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Tabs defaultValue="users" className="space-y-3 sm:space-y-4">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="users" className="text-xs sm:text-sm py-2">Users</TabsTrigger>
              <TabsTrigger value="roles" className="text-xs sm:text-sm py-2">Roles & Permissions</TabsTrigger>
              <TabsTrigger value="activities" className="text-xs sm:text-sm py-2">User Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-3 sm:space-y-4">
              {/* Bulk Actions */}
              <BulkUserActions
                selectedUsers={selectedUsers}
                onClearSelection={() => setSelectedUsers([])}
                onBulkStatusUpdate={handleBulkStatusUpdate}
                onBulkRoleUpdate={handleBulkRoleUpdate}
                onBulkDelete={handleBulkDelete}
                onExportUsers={handleExportUsers}
                onImportUsers={handleImportUsers}
              />
              
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Daftar User</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manajemen user dan informasi akun
                    {filteredUsers.length !== totalUsers && (
                      <span className="ml-2 text-primary">
                        ({filteredUsers.length} dari {totalUsers} user)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <div className="overflow-x-auto">
                    <UserTable
                      users={filteredUsers}
                      isLoading={loading}
                      onEdit={handleEditUser}
                      onView={handleViewUser}
                      onDelete={handleDeleteUser}
                      onToggleStatus={handleToggleStatus}
                      onViewActivity={handleViewActivity}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-3 sm:space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Roles & Permissions Management</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage system roles and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 sm:py-8">
                    <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">Role management coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-3 sm:space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">User Activities</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Recent user activities and system logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 sm:py-8">
                    <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">Activity monitoring coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-background mx-2 sm:mx-auto max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0" />
                <span className="truncate">Delete User</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
              <p className="text-xs sm:text-sm text-destructive font-medium">
                ⚠️ Warning: This will permanently delete all user data!
              </p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} size="sm" className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} size="sm" className="w-full sm:w-auto">
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <EditUserDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          user={userToEdit}
          departments={departments}
          onUpdate={updateUser}
          isLoading={loading}
        />

        {/* View User Dialog */}
        <UserDetailDialog
          isOpen={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          user={userToView}
          activities={activities}
          isLoadingActivities={loading}
          onFetchActivities={fetchUserActivity}
        />
      </div>
      </MainLayout>
    </ErrorBoundary>
  );
}
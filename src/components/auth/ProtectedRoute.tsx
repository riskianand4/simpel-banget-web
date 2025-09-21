import React from 'react';
import { useApp } from '@/contexts/AppContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'superadmin';
  allowedRoles?: ('user' | 'superadmin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles = [] 
}) => {
  const { user, isAuthenticated, isLoading } = useApp();

  // Show loading during auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  // Check role permissions
  const hasRequiredRole = () => {
    if (!requiredRole && allowedRoles.length === 0) return true;
    
    // Role hierarchy: superadmin > user
    const roleHierarchy = { user: 1, superadmin: 2 };
    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    
    // Check specific required role
    if (requiredRole) {
      const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy];
      return userRoleLevel >= requiredRoleLevel;
    }
    
    // Check allowed roles list
    if (allowedRoles.length > 0) {
      return allowedRoles.includes(user.role as 'user' | 'superadmin');
    }
    
    return true;
  };

  // Show access denied if insufficient permissions
  if (!hasRequiredRole()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <p className="text-sm text-muted-foreground">
              Role Anda: <span className="font-medium capitalize">{user.role}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Role yang diperlukan: <span className="font-medium capitalize">
                {requiredRole || allowedRoles.join(', ')}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
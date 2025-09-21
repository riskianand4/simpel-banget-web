import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PSBSidebar } from './PSBSidebar';
import { PSBMobileNav } from './PSBMobileNav';
import { PSBRoutes } from './PSBRoutes';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, UserCog } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
export const PSBLayout: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    logout
  } = useAuth();
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-destructive';
      case 'admin':
        return 'bg-warning';
      default:
        return 'bg-success';
    }
  };
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <PSBSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.header initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3
        }} className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="md:hidden" />
              
            </div>

            <div className="flex items-center space-x-3">
              <NotificationCenter />
              <ThemeToggle />
              
              <div className="flex items-center space-x-3 border-l border-border/50 pl-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <Badge className={`text-xs px-2 py-0.5 w-fit ${getRoleBadgeColor(user?.role || '')}`}>
                          {getRoleLabel(user?.role || '')}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="flex-1 pb-16 md:pb-0">
            <div className="container mx-auto p-4 md:p-6">
              <PSBRoutes />
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {/* <PSBMobileNav /> */}
      </div>
    </SidebarProvider>;
};
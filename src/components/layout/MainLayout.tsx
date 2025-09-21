import React, { useState, useEffect, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMoreMenu } from './MobileMoreMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Bell, Search, User, BookOpen, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QuickSearch } from './QuickSearch';
import { WelcomeSection } from './WelcomeSection';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import NotificationCenter from './NotificationCenter';
import SyncStatusIndicator from './SyncStatusIndicator';

// Removed useAlertNotifications - using OptimizedAlertMonitor instead
interface MainLayoutProps {
  children: React.ReactNode;
}
const MainLayout = memo(function MainLayout({
  children
}: MainLayoutProps) {
  const {
    user,
    logout
  } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Alert notifications now handled by OptimizedAlertMonitor in App.tsx

  // Keyboard shortcut for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
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
  // Check if we should show more menu based on route
  useEffect(() => {
    if (location.pathname === '/more') {
      setShowMoreMenu(true);
    }
  }, [location.pathname]);
  const handleMoreMenuClose = (reason?: 'dismiss' | 'navigated') => {
    setShowMoreMenu(false);
    if (reason !== 'navigated' && location.pathname === '/more') {
      window.history.back();
    }
  };
  if (isMobile) {
    return <div className="min-h-screen flex flex-col w-full bg-background pb-16">
        {/* Mobile Header */}
        <motion.header className="mobile-header-compact border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-3" initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3
      }}>
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
              <Wifi className="w-3 h-3 text-white" />
            </div>
            <div>
              <h1 className="mobile-text-tiny font-bold text-foreground">Telnet</h1>
            </div>
          </div>

          {/* Mobile Header Actions */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setShowSearch(true)} className="h-7 w-7 p-0">
              <Search className="h-3 w-3" />
            </Button>
            
            <NotificationCenter />
            <ThemeToggle />
          </div>
        </motion.header>

        {/* Mobile Main Content */}
        <main className="flex-1 mobile-padding-compact overflow-auto">
          {/* Welcome Section for Mobile */}
          <WelcomeSection className="mb-4" />
          
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.4,
          delay: 0.1
        }} className="h-full mobile-content-container">
            {children}
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
        {/* Mobile More Menu */}
        <MobileMoreMenu isOpen={showMoreMenu || location.pathname === '/more'} onClose={handleMoreMenuClose} />
        
        {/* Quick Search */}
        <QuickSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
        
      </div>;
  }

  // Desktop Layout
  return <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <motion.header initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3
        }} className="h-12 sm:h-14  h-[89px] lg:h-[89px] border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-2 sm:px-4 lg:px-6">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <SidebarTrigger className="lg:hidden p-1 ml-4 sm:p-2" />
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              <Button variant="outline" size="sm" onClick={() => setShowSearch(true)} className="flex items-center gap-2 text-muted-foreground h-8 sm:h-9">
                <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Search...</span>
              </Button>
              
              <SyncStatusIndicator />
              <NotificationCenter />
              <ThemeToggle />
              
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8 w-8 sm:h-9 sm:w-9 p-1 sm:p-2" onClick={() => window.open('/documentation', '_blank')}>
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                <motion.div whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }}>
                  <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9">
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.header>

          <main className="flex-1 mobile-responsive-padding overflow-hidden">
            {/* Welcome Section for Desktop */}
            <WelcomeSection className="mb-6 mx-4 lg:mx-6 mt-4 lg:mt-6" />
            
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.4,
            delay: 0.1
          }} className="h-full mobile-content-container">
              {children}
            </motion.div>
          </main>
        </div>
      </div>
      
      {/* Quick Search */}
      <QuickSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
      
    </SidebarProvider>;
});
export default MainLayout;
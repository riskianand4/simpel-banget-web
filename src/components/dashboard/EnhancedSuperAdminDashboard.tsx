import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Activity, RefreshCw, TrendingUp, BarChart3, Eye } from 'lucide-react';
import WelcomeCard from '@/components/onboarding/WelcomeCard';
import StockMovementChart from './StockMovementChart';
import QuickStatsGrid from './QuickStatsGrid';
import SystemOverviewPanel from './SystemOverviewPanel';
import { User } from '@/types/auth';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import useSuperAdminDashboard from '@/hooks/useSuperAdminDashboard';
interface EnhancedSuperAdminDashboardProps {
  user: User;
  onStartTour?: () => void;
}
const EnhancedSuperAdminDashboard: React.FC<EnhancedSuperAdminDashboardProps> = ({
  user,
  onStartTour
}) => {
  const isMobile = useIsMobile();
  const {
    metrics,
    activities,
    alerts,
    locations,
    loading,
    error,
    refreshData
  } = useSuperAdminDashboard();
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  return <motion.div className="space-y-6 pb-14 sm:pb-5" variants={containerVariants} initial="hidden" animate="visible">
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <WelcomeCard user={user} onStartTour={onStartTour || (() => {})} />
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div variants={itemVariants}>
        <div className={`flex justify-between items-center ${isMobile ? 'mb-3' : 'mb-4'}`}>
          <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? 'text-xs px-2' : ''} onClick={refreshData}>
              <RefreshCw className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
              {isMobile ? 'Refresh' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* System Metrics Grid */}
      <motion.div variants={itemVariants}>
        <QuickStatsGrid metrics={metrics} loading={loading} />
      </motion.div>

      {/* Main Dashboard Content */}
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-1 gap-6'}`}>
        {/* Stock Movement Visualization - Takes 2 columns */}
        <motion.div variants={itemVariants} className={isMobile ? '' : 'lg:col-span-2'}>
          <StockMovementChart />
        </motion.div>

        
      </div>

      {/* System Overview Panels */}
      <motion.div variants={itemVariants}>
        <SystemOverviewPanel activities={activities} alerts={alerts} locations={locations} loading={loading} />
      </motion.div>

      {/* Loading State */}
      {loading && <motion.div variants={itemVariants} className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system data...</p>
        </motion.div>}

      {/* Error State */}
      {error && <motion.div variants={itemVariants}>
          <div className="p-4 rounded-lg border border-destructive bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive">
              <Activity className="h-4 w-4" />
              <p className="text-sm">Error: {error}</p>
              <Button variant="outline" size="sm" onClick={refreshData} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </motion.div>}
    </motion.div>;
};
export default EnhancedSuperAdminDashboard;
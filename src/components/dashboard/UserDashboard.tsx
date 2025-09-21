import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, BarChart3, FileText, Package, TrendingUp, AlertTriangle, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import WelcomeCard from '@/components/onboarding/WelcomeCard';
import { User } from '@/types/auth';
import { motion } from 'framer-motion';
import { useOptimizedDashboardData } from '@/hooks/useOptimizedDashboardData';

interface UserDashboardProps {
  user: User;
  onStartTour?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onStartTour }) => {
  const {
    stats,
    recentActivities,
    loading,
    error
  } = useOptimizedDashboardData();

  const quickActions = [
    {
      title: 'View Products',
      description: 'Browse product catalog and check availability',
      icon: Package,
      href: '/products',
      color: 'bg-primary/10 hover:bg-primary/20 border-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
    },
    {
      title: 'Check Analytics',
      description: 'View sales trends and inventory insights',
      icon: BarChart3,
      href: '/stats',
      color: 'bg-success/10 hover:bg-success/20 border-success/20 dark:bg-success/20 dark:hover:bg-success/30'
    },
    {
      title: 'Generate Reports',
      description: 'Create detailed inventory reports',
      icon: FileText,
      href: '/reports',
      color: 'bg-accent/10 hover:bg-accent/20 border-accent/20 dark:bg-accent/20 dark:hover:bg-accent/30'
    },
    {
      title: 'View Alerts',
      description: 'Check stock alerts and notifications',
      icon: AlertTriangle,
      href: '/alerts',
      color: 'bg-warning/10 hover:bg-warning/20 border-warning/20 dark:bg-warning/20 dark:hover:bg-warning/30'
    }
  ];

  const recentStats = stats ? [
    { label: 'Total Products', value: stats.productsManaged.toLocaleString(), icon: Package, trend: stats.productsTrend },
    { label: 'Low Stock Items', value: stats.lowStockItems.toString(), icon: AlertTriangle, trend: stats.stockTrend },
    { label: 'Active Users', value: stats.activeUsers.toString(), icon: Users, trend: stats.usersTrend },
    { label: 'Pending Approvals', value: stats.pendingApprovals.toString(), icon: Clock, trend: stats.approvalsTrend }
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="mobile-spacing-normal"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <WelcomeCard user={user} onStartTour={onStartTour || (() => {})} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="mobile-text-large font-bold mb-3 sm:mb-4">Quick Overview</h2>
        {error && (
          <div className="mb-3 sm:mb-4 mobile-padding-compact bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mobile-text-small">
            {error}
          </div>
        )}
        
        {/* Responsive grid: 2 columns mobile, 4 columns desktop */}
        <div className="mobile-grid-2-4 mobile-gap-normal">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="mobile-card-compact hover:shadow-md transition-shadow">
                <CardContent className="mobile-card-padding">
                  <div className="animate-pulse">
                    <div className="h-12 sm:h-16 bg-muted/50 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            recentStats.map((stat) => (
              <Card key={stat.label} className="mobile-card-compact hover:shadow-md transition-shadow">
                <CardContent className="mobile-card-padding">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-spacing-tight">
                    <div className="flex-1 min-w-0">
                      <p className="mobile-text-tiny font-medium text-muted-foreground truncate">{stat.label}</p>
                      <p className="mobile-text-small font-bold truncate">{stat.value}</p>
                      <p className="mobile-text-tiny text-success truncate desktop-only">{stat.trend} from last month</p>
                    </div>
                    <stat.icon className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0 self-end sm:self-auto" />
                  </div>
                  {/* Mobile trend indicator */}
                  <p className="mobile-text-tiny text-success mobile-only">{stat.trend}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="mobile-text-large font-bold mb-3 sm:mb-4">Quick Actions</h2>
        
        {/* Responsive grid: 1 column mobile, 2 columns tablet+ */}
        <div className="mobile-grid-1-2 mobile-gap-normal">
          {quickActions.map((action) => (
            <div key={action.title} className="hover-scale">
              <Card className={`mobile-card-compact cursor-pointer transition-all duration-200 ${action.color}`}>
                <Link to={action.href}>
                  <CardHeader className="mobile-card-padding">
                    <div className="flex items-center mobile-gap-normal">
                      <action.icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="mobile-text-small truncate">{action.title}</CardTitle>
                        <CardDescription className="mobile-text-tiny line-clamp-2 sm:line-clamp-none">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="mobile-card-compact">
          <CardHeader className="mobile-card-padding">
            <CardTitle className="flex items-center mobile-gap-normal mobile-text-medium">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="mobile-card-padding pt-0">
            {loading ? (
              <div className="space-y-2 sm:space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-10 sm:h-12 bg-muted/50 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentActivities.slice(0, 3).map((activity, index) => (
                  <div key={activity.id || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b last:border-b-0 gap-1 sm:gap-0">
                    <span className="text-xs sm:text-sm pr-2 sm:pr-0 leading-relaxed">{activity.message}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{activity.time}</span>
                  </div>
                ))}
                {recentActivities.length === 0 && !loading && (
                  <div className="text-center py-6 sm:py-4 text-muted-foreground text-sm">
                    No recent activities available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default UserDashboard;
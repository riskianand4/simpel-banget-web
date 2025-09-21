import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import StatsFilters from './stats/StatsFilters';
import KPIDashboard from './stats/KPIDashboard';
import TrendAnalysis from './stats/TrendAnalysis';
import CategoryAnalysis from './stats/CategoryAnalysis';
import VelocityAnalysis from './stats/VelocityAnalysis';
import SmartInsights from './stats/SmartInsights';
import PredictiveAnalytics from './stats/PredictiveAnalytics';
import StockMovementFlow from './stats/advanced/StockMovementFlow';
import StockHealthGauge from './stats/advanced/StockHealthGauge';
import RealtimeMonitoring from './stats/advanced/RealtimeMonitoring';
import SupplyChainMonitor from './stats/advanced/SupplyChainMonitor';
import FinancialAnalytics from './stats/advanced/FinancialAnalytics';
export type TimeFilter = 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};
const AdvancedStatsOverview = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // Animation variants
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
  return <div className="min-h-screen bg-muted/10 px-2 sm:px-4 md:px-6 py-4 md:py-6 lg:py-8 lg:px-2">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6 px-2 sm:px-4">
        <motion.div variants={itemVariants}>
          <StatsFilters timeFilter={timeFilter} onTimeFilterChange={setTimeFilter} dateRange={dateRange} onDateRangeChange={setDateRange} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPIDashboard timeFilter={timeFilter} dateRange={dateRange} />
        </motion.div>

        {/* Real-time Monitoring Section */}
        <motion.div variants={itemVariants}>
          <RealtimeMonitoring />
        </motion.div>

        {/* Stock Health & Movement Flow */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <motion.div variants={itemVariants}>
            <StockHealthGauge />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StockMovementFlow timeFilter={timeFilter} dateRange={dateRange} />
          </motion.div>
        </div>

        {/* Advanced Analytics Section */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          <motion.div variants={itemVariants}>
            <TrendAnalysis timeFilter={timeFilter} dateRange={dateRange} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <SupplyChainMonitor />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FinancialAnalytics timeFilter={timeFilter} dateRange={dateRange} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <CategoryAnalysis timeFilter={timeFilter} dateRange={dateRange} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <VelocityAnalysis timeFilter={timeFilter} dateRange={dateRange} />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <PredictiveAnalytics />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <SmartInsights timeFilter={timeFilter} />
          </motion.div>
        </div>
      </motion.div>
    </div>;
};
export default AdvancedStatsOverview;
import { useState, useEffect } from 'react';
import { 
  getDashboardStats, 
  getPendingApprovals, 
  getRecentActivities, 
  getInventoryHealth,
  approveRequest,
  rejectRequest,
  DashboardStats,
  PendingApproval,
  RecentActivity,
  InventoryHealth
} from '@/services/dashboardApi';

export interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  pendingApprovals: PendingApproval[];
  recentActivities: RecentActivity[];
  inventoryHealth: InventoryHealth | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  handleApprove: (id: string) => Promise<void>;
  handleReject: (id: string) => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Progressive loading: Load critical stats first, then secondary data
      // Phase 1: Load critical stats with fallback to localStorage
      const cachedStats = localStorage.getItem('dashboard-stats-cache');
      const cachedTimestamp = localStorage.getItem('dashboard-stats-timestamp');
      const isCacheValid = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < 60000; // 1 minute cache

      if (cachedStats && isCacheValid) {
        const cached = JSON.parse(cachedStats);
        setStats(cached.stats);
        setPendingApprovals(cached.approvals || []);
        setRecentActivities(cached.activities || []);
        setInventoryHealth(cached.health);
        setLoading(false);
        
        // Load fresh data in background
        fetchFreshData();
        return;
      }

      // Load essential data with timeout protection
      const statsPromise = Promise.race([
        getDashboardStats(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stats timeout')), 5000)
        )
      ]);

      const statsData = await statsPromise as any;
      setStats(statsData);
      setLoading(false); // Show UI immediately with stats

      // Load secondary data in parallel with graceful degradation
      const secondaryPromises = [
        getPendingApprovals().catch(() => []),
        getRecentActivities().catch(() => []),
        getInventoryHealth().catch(() => ({
          stockAccuracy: 0,
          avgTurnover: 0,
          lowStockCount: 0,
          activeSKUs: 0,
          skusTrend: 'No data available'
        }))
      ];

      const [approvalsData, activitiesData, healthData] = await Promise.all(secondaryPromises);
      
      setPendingApprovals(approvalsData as PendingApproval[]);
      setRecentActivities(activitiesData as RecentActivity[]);
      setInventoryHealth(healthData as InventoryHealth);

      // Cache successful results
      const cacheData = {
        stats: statsData,
        approvals: approvalsData,
        activities: activitiesData,
        health: healthData
      };
      localStorage.setItem('dashboard-stats-cache', JSON.stringify(cacheData));
      localStorage.setItem('dashboard-stats-timestamp', Date.now().toString());

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      const [statsData, approvalsData, activitiesData, healthData] = await Promise.allSettled([
        getDashboardStats(),
        getPendingApprovals(),
        getRecentActivities(),
        getInventoryHealth()
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (approvalsData.status === 'fulfilled') setPendingApprovals(approvalsData.value);
      if (activitiesData.status === 'fulfilled') setRecentActivities(activitiesData.value);
      if (healthData.status === 'fulfilled') setInventoryHealth(healthData.value);

      // Update cache
      const cacheData = {
        stats: statsData.status === 'fulfilled' ? statsData.value : null,
        approvals: approvalsData.status === 'fulfilled' ? approvalsData.value : [],
        activities: activitiesData.status === 'fulfilled' ? activitiesData.value : [],
        health: healthData.status === 'fulfilled' ? healthData.value : null
      };
      localStorage.setItem('dashboard-stats-cache', JSON.stringify(cacheData));
      localStorage.setItem('dashboard-stats-timestamp', Date.now().toString());
    } catch (err) {
      console.error('Background refresh failed:', err);
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id);
      // Remove the approved item from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id));
      // Refresh stats to get updated counts
      const updatedStats = await getDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(id);
      // Remove the rejected item from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id));
      // Refresh stats to get updated counts
      const updatedStats = await getDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    stats,
    pendingApprovals,
    recentActivities,
    inventoryHealth,
    loading,
    error,
    refreshData,
    handleApprove,
    handleReject
  };
};

export default useDashboardData;
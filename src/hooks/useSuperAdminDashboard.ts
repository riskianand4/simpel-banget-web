import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

export interface SystemMetric {
  label: string;
  value: string;
  icon: string;
  trend: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface AdminActivity {
  admin: string;
  action: string;
  location: string;
  time: string;
  risk: 'low' | 'medium' | 'high';
}

export interface CriticalAlert {
  message: string;
  severity: 'success' | 'warning' | 'critical' | 'info';
  time: string;
  action: string;
  affected: string;
}

export interface LocationStats {
  location: string;
  products: number;
  alerts: number;
  health: number;
}

export const useSuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [locations, setLocations] = useState<LocationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real data from backend APIs
      const [metricsResponse, activitiesResponse, alertsResponse, locationsResponse] = await Promise.allSettled([
        apiClient.get('/api/system/metrics'),
        apiClient.get('/api/system/activities'),
        apiClient.get('/api/system/alerts'),
        apiClient.get('/api/system/locations')
      ]);

      // Process metrics
      if (metricsResponse.status === 'fulfilled' && (metricsResponse.value as any).success) {
        setMetrics((metricsResponse.value as any).data.metrics || []);
      } else {
        setMetrics([]);
      }

      // Process activities
      if (activitiesResponse.status === 'fulfilled' && (activitiesResponse.value as any).success) {
        const activitiesData = (activitiesResponse.value as any).data || [];
        const activities = activitiesData.map((activity: any) => ({
          admin: activity.admin || activity.adminId?.name || 'System',
          action: activity.action,
          location: activity.location || activity.resource,
          time: new Date(activity.timestamp).toLocaleString('id-ID'),
          risk: activity.risk
        }));
        setActivities(activities);
      } else {
        setActivities([]);
      }

      // Process alerts
      if (alertsResponse.status === 'fulfilled' && (alertsResponse.value as any).success) {
        setAlerts((alertsResponse.value as any).data || []);
      } else {
        setAlerts([]);
      }

      // Process locations
      if (locationsResponse.status === 'fulfilled' && (locationsResponse.value as any).success) {
        setLocations((locationsResponse.value as any).data || []);
      } else {
        setLocations([]);
      }

      setLoading(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    metrics,
    activities,
    alerts,
    locations,
    loading,
    error,
    refreshData
  };
};

export default useSuperAdminDashboard;
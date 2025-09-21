import { apiClient } from './apiClient';

export interface SystemMetrics {
  label: string;
  value: string;
  icon: string;
  trend: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface SystemHealth {
  current: {
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: string;
    };
    database: {
      status: string;
      responseTime: number;
    };
  };
  status: string;
  timestamp: Date;
}

export interface AdminActivity {
  _id: string;
  admin: string;
  action: string;
  location: string;
  timestamp: Date;
  risk: 'low' | 'medium' | 'high';
}

export interface SystemAlert {
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

export const getSystemMetrics = async (): Promise<SystemMetrics[]> => {
  try {
    const response = await apiClient.get('/api/system/metrics') as any;
    if (response.success && response.data) {
      return response.data.metrics || [];
    }
    throw new Error('Failed to fetch system metrics');
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return [];
  }
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    const response = await apiClient.get('/api/system/health') as any;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch system health');
  } catch (error) {
    console.error('Error fetching system health:', error);
    return {
      current: {
        uptime: 0,
        memoryUsage: { used: 0, total: 0, percentage: '0%' },
        database: { status: 'unknown', responseTime: 0 }
      },
      status: 'unknown',
      timestamp: new Date()
    };
  }
};

export const getAdminActivities = async (limit = 20): Promise<AdminActivity[]> => {
  try {
    const response = await apiClient.get(`/api/system/activities?limit=${limit}`) as any;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch admin activities');
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    return [];
  }
};

export const getSystemAlerts = async (): Promise<SystemAlert[]> => {
  try {
    const response = await apiClient.get('/api/system/alerts') as any;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch system alerts');
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return [];
  }
};

export const getLocationStats = async (): Promise<LocationStats[]> => {
  try {
    const response = await apiClient.get('/api/system/locations') as any;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch location stats');
  } catch (error) {
    console.error('Error fetching location stats:', error);
    return [];
  }
};

export const logAdminActivity = async (activity: {
  action: string;
  resource?: string;
  location?: string;
  details?: any;
  risk?: 'low' | 'medium' | 'high';
}): Promise<void> => {
  try {
    await apiClient.post('/api/system/activities', activity);
  } catch (error) {
    console.error('Error logging admin activity:', error);
    // Don't throw error for logging failures
  }
};

export default {
  getSystemMetrics,
  getSystemHealth,
  getAdminActivities,
  getSystemAlerts,
  getLocationStats,
  logAdminActivity
};
import { apiClient } from './apiClient';

export interface ApiMonitoringData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  topEndpoints: {
    endpoint: string;
    count: number;
  }[];
  requestsToday: {
    hour: string;
    requests: number;
  }[];
  statusCodes: {
    code: number;
    count: number;
  }[];
  recentLogs: ApiLogEntry[];
}

export interface ApiLogEntry {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  apiKeyName: string;
  ipAddress: string;
  userAgent: string;
  errorType?: string;
}

export interface PerformanceMetrics {
  totalRequests: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

export class MonitoringService {
  async getApiMonitoringData(timeRange = '24h'): Promise<ApiMonitoringData> {
    try {
      const response = await apiClient.get(`/api/monitoring/api-data?timeRange=${timeRange}`);
      // Raw monitoring response received
      
      // Backend returns { success: true, data: ApiMonitoringData }
      const responseData = (response as any)?.data?.data || (response as any)?.data;
      // Monitoring data parsed
      
      // Process recent logs to ensure proper date formatting and add missing fields
      const processedLogs = (responseData?.recentLogs || []).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        apiKeyName: log.apiKeyName || 'Unknown',
        ipAddress: log.ipAddress || log.ip || 'N/A',
        userAgent: log.userAgent || 'N/A'
      }));
      
      // Logs processed successfully
      
      return {
        totalRequests: responseData?.totalRequests || 0,
        successfulRequests: responseData?.successfulRequests || 0,
        failedRequests: responseData?.failedRequests || 0,
        averageResponseTime: responseData?.averageResponseTime || 0,
        topEndpoints: responseData?.topEndpoints || [],
        requestsToday: responseData?.requestsToday || [],
        statusCodes: responseData?.statusCodes || [],
        recentLogs: processedLogs
      };
    } catch (error) {
      // Failed to fetch API monitoring data
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        topEndpoints: [],
        requestsToday: [],
        statusCodes: [],
        recentLogs: []
      };
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await apiClient.get('/api/monitoring/metrics');
      // Backend returns { success: true, data: PerformanceMetrics }
      return (response as any)?.data?.data || {
        totalRequests: 0,
        errorCount: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0
      };
    } catch (error) {
      // Failed to fetch performance metrics
      return {
        totalRequests: 0,
        errorCount: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0
      };
    }
  }

  async getHealthStatus() {
    try {
      const response = await apiClient.get('/api/monitoring/health');
      return response.data;
    } catch (error) {
      // Failed to fetch health status
      throw error;
    }
  }
}

export const monitoringService = new MonitoringService();
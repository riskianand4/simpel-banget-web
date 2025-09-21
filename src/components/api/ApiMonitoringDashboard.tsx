import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Activity, Clock, AlertTriangle, TrendingUp, RefreshCw, Filter, Check } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock interface for demonstration
interface ApiMonitoringData {
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  requestsToday: any[];
  statusCodes: { code: number; count: number }[];
  recentLogs: {
    id: string;
    timestamp: string;
    method: string;
    endpoint: string;
    statusCode: number;
    responseTime: number;
    apiKeyName: string;
    ipAddress: string;
    errorType?: string;
  }[];
}

// Mock service for demonstration
const monitoringService = {
  getApiMonitoringData: async (timeRange: string): Promise<ApiMonitoringData> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      totalRequests: 15420,
      failedRequests: 342,
      successfulRequests: 15078,
      averageResponseTime: 145.7,
      requestsToday: [],
      statusCodes: [
        { code: 200, count: 12500 },
        { code: 401, count: 150 },
        { code: 404, count: 120 },
        { code: 500, count: 72 }
      ],
      recentLogs: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          method: 'GET',
          endpoint: '/api/products',
          statusCode: 200,
          responseTime: 120,
          apiKeyName: 'prod-key-123',
          ipAddress: '192.168.1.100'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          method: 'POST',
          endpoint: '/api/auth',
          statusCode: 401,
          responseTime: 45,
          apiKeyName: 'invalid-key',
          ipAddress: '192.168.1.200',
          errorType: 'UNAUTHORIZED'
        }
      ]
    };
  }
};

export const ApiMonitoringDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [filterEndpoint, setFilterEndpoint] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [monitoringData, setMonitoringData] = useState<ApiMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const data = await monitoringService.getApiMonitoringData(timeRange);
      setMonitoringData(data);
    } catch (error) {
      // Failed to fetch monitoring data
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMonitoringData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [timeRange]);

  // Prepare chart data
  const usageData = monitoringData?.requestsToday || [];
  const statusData = monitoringData?.statusCodes.map(item => ({
    name: `${item.code} (${item.code >= 200 && item.code < 300 ? 'Success' : item.code >= 400 ? 'Error' : 'Other'})`,
    value: item.count,
    color: item.code >= 200 && item.code < 300 ? '#10b981' : item.code >= 400 ? '#ef4444' : '#f59e0b'
  })) || [];

  // Filter recent logs
  const filteredLogs = monitoringData?.recentLogs.filter(log => {
    const endpointMatch = filterEndpoint === 'all' || log.endpoint.includes(filterEndpoint);
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === '2xx' && log.statusCode >= 200 && log.statusCode < 300) ||
      (filterStatus === '4xx' && log.statusCode >= 400 && log.statusCode < 500) ||
      (filterStatus === '5xx' && log.statusCode >= 500);
    return endpointMatch && statusMatch;
  }) || [];

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500/10 text-green-600';
    if (status >= 400 && status < 500) return 'bg-yellow-500/10 text-yellow-600';
    if (status >= 500) return 'bg-red-500/10 text-red-600';
    return 'bg-muted';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500/10 text-green-500';
      case 'POST':
        return 'bg-blue-500/10 text-blue-500';
      case 'PUT':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-14 sm:pb-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {loading ? '...' : monitoringData?.totalRequests.toLocaleString() || '0'}
                </p>
              </div>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Failed Requests</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {loading ? '...' : monitoringData?.failedRequests.toLocaleString() || '0'}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
            <div className="flex items-center mt-2 text-xs sm:text-sm text-muted-foreground">
              Success: {loading ? '...' : monitoringData?.successfulRequests.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {loading ? '...' : `${Math.round(monitoringData?.averageResponseTime || 0)}ms`}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Recent Logs</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {loading ? '...' : monitoringData?.recentLogs.length || '0'}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2 text-xs sm:text-sm text-muted-foreground">
              Last {timeRange}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Security Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Security Alert Panel */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-red-600 text-lg sm:text-xl">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
              Security Alerts
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">Recent suspicious API activities</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground text-sm sm:text-base">Loading alerts...</div>
            ) : (
              <div className="space-y-2">
                {filteredLogs?.filter(log => log.statusCode >= 400).slice(0, 5).map(log => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 rounded border">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${getStatusColor(log.statusCode)} text-xs`}>
                        {log.statusCode}
                      </Badge>
                      <span className="text-xs sm:text-sm font-mono break-all">{log.ipAddress}</span>
                      <span className="text-xs text-muted-foreground">
                        {log.errorType || 'Unknown Error'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )) || (
                  <div className="text-center py-4 text-green-600">
                    <Check className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                    <p className="text-sm sm:text-base">No security alerts</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Status Distribution Chart */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Request Status Distribution</CardTitle>
            <CardDescription className="text-sm sm:text-base">HTTP status code breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !monitoringData?.statusCodes?.length ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">No status data available</div>
            ) : (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent API Logs */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
            Recent API Logs
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Latest API requests and responses</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
              <Select value={filterEndpoint} onValueChange={setFilterEndpoint}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All endpoints" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All endpoints</SelectItem>
                  <SelectItem value="/api/products">Products</SelectItem>
                  <SelectItem value="/api/analytics">Analytics</SelectItem>
                  <SelectItem value="/api/users">Users</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="2xx">Success</SelectItem>
                  <SelectItem value="4xx">Client Error</SelectItem>
                  <SelectItem value="5xx">Server Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">Loading API logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">No API logs found</div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm whitespace-nowrap">Timestamp</TableHead>
                    <TableHead className="text-xs sm:text-sm">Method</TableHead>
                    <TableHead className="text-xs sm:text-sm">Endpoint</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm whitespace-nowrap">Response Time</TableHead>
                    <TableHead className="text-xs sm:text-sm whitespace-nowrap">API Key / Error</TableHead>
                    <TableHead className="text-xs sm:text-sm whitespace-nowrap">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        <div className="hidden sm:block">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="sm:hidden">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getMethodColor(log.method)} text-xs whitespace-nowrap`}>
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs break-all">{log.endpoint}</code>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(log.statusCode)} text-xs`}>
                          {log.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{log.responseTime}ms</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-mono text-muted-foreground break-all">
                            {log.apiKeyName}
                          </span>
                          {log.statusCode >= 400 && (
                            <Badge variant="outline" className="text-xs w-fit">
                              {log.errorType || 'ERROR'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{log.ipAddress}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
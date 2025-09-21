import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, BellOff, CheckCircle, Clock, AlertCircle, Settings, Filter } from 'lucide-react';
import { useOptimizedStockAlerts } from '@/hooks/useOptimizedStockAlerts';
import { StockAlert } from '@/types/stock-movement';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { safeFormatDate } from '@/utils/dateUtils';

// Helper function to safely extract name from acknowledgedBy field
const getAcknowledgedByName = (acknowledgedBy: any): string => {
  if (!acknowledgedBy) return 'Unknown';
  if (typeof acknowledgedBy === 'string') return acknowledgedBy;
  if (typeof acknowledgedBy === 'object' && acknowledgedBy.name) return acknowledgedBy.name;
  return String(acknowledgedBy);
};

const OptimizedAutomatedStockAlerts = () => {
  const {
    alerts,
    acknowledgeAlert,
    getAlertStats
  } = useOptimizedStockAlerts();
  const {
    user
  } = useAuth();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const stats = getAlertStats;

  // Memoized color functions
  const getSeverityColor = useMemo(() => (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'LOW':
        return 'bg-muted text-muted-foreground border-muted/20';
      default:
        return 'bg-muted text-muted-foreground border-muted/20';
    }
  }, []);
  const getSeverityIcon = useMemo(() => (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM':
        return <Clock className="w-4 h-4" />;
      case 'LOW':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  }, []);
  const getTypeColor = useMemo(() => (type: any) => {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('out_of_stock') || typeStr.includes('out of stock')) {
      return 'bg-destructive';
    }
    if (typeStr.includes('low_stock') || typeStr.includes('low stock')) {
      return 'bg-warning';
    }
    if (typeStr.includes('overstock') || typeStr.includes('overstocked')) {
      return 'bg-primary';
    }
    if (typeStr.includes('expir') || typeStr.includes('expired')) {
      return 'bg-secondary';
    }
    return 'bg-muted';
  }, []);

  // Memoized filtered alerts
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter(alert => {
      const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
      const matchesStatus = statusFilter === 'ALL' || statusFilter === 'ACKNOWLEDGED' && alert.acknowledged || statusFilter === 'UNACKNOWLEDGED' && !alert.acknowledged;
      return matchesSeverity && matchesStatus;
    });
  }, [alerts, severityFilter, statusFilter]);
  const handleAcknowledgeAlert = async (alertId: string) => {
    if (user?.name) {
      await acknowledgeAlert(alertId, user.name);
    }
  };
  if (!alertsEnabled) {
    return <Card className="mx-2 sm:mx-0">
        <CardContent className="p-4 sm:p-6 text-center">
          <BellOff className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm sm:text-base text-muted-foreground">Stock alerts are disabled</p>
          <Button onClick={() => setAlertsEnabled(true)} className="mt-4" variant="outline" size="sm">
            Enable Alerts
          </Button>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4 sm:space-y-6 ">
      {/* Alert Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <motion.div className="col-span-1" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }}>
          <Card className="h-full">
            <CardContent className="p-3 sm:p-4 h-full flex items-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Alerts</p>
                  <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="col-span-1" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }}>
          <Card className="h-full">
            <CardContent className="p-3 sm:p-4 h-full flex items-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Critical</p>
                  <p className="text-lg sm:text-xl font-bold text-destructive">{stats.critical}</p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="col-span-2 sm:col-span-1" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }}>
          <Card className="h-full">
            <CardContent className="p-3 sm:p-4 h-full flex items-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">High Priority</p>
                  <p className="text-lg sm:text-xl font-bold text-warning">{stats.high}</p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="col-span-1" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }}>
          <Card className="h-full">
            <CardContent className="p-3 sm:p-4 h-full flex items-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Medium</p>
                  <p className="text-lg sm:text-xl font-bold text-primary">{stats.medium}</p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="col-span-1" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.5
      }}>
          <Card className="h-full">
            <CardContent className="p-3 sm:p-4 h-full flex items-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Unack.</p>
                  <p className="text-lg sm:text-xl font-bold">{stats.unacknowledged}</p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BellOff className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alert Settings & Filters */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-3 sm:space-y-0">
            <span className="flex items-center gap-2 text-base sm:text-xl lg:text-2xl">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              Alert Settings & Filters
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs sm:text-sm">Alerts Enabled</span>
              <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                <SelectItem value="UNACKNOWLEDGED">Unacknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            Stock Alerts ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            {filteredAlerts.length === 0 ? <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Filter className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No alerts found matching your criteria</p>
              </div> : filteredAlerts.slice(0, 50).map((alert, index) =>
          // Limit to 50 items for performance
          <motion.div key={alert.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: Math.min(index * 0.02, 0.5)
          }} // Cap delay to prevent long waits
          className={`p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors ${alert.acknowledged ? 'opacity-75' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 mb-3">
                    <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className={`w-1 sm:w-2 h-12 sm:h-16 rounded-full flex-shrink-0 ${getTypeColor(alert.type)}`} />
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h4 className="font-medium text-sm sm:text-base truncate">{alert.productName}</h4>
                          <Badge className={`${getSeverityColor(alert.severity)} text-xs self-start sm:self-auto flex-shrink-0`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {alert.productCode} • {String(alert.type).replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    {!alert.acknowledged && <Button onClick={() => handleAcknowledgeAlert(alert.id)} size="sm" variant="outline" className="gap-1 sm:gap-2 flex-shrink-0 text-xs sm:text-sm">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Acknowledge</span>
                        <span className="xs:hidden">Ack</span>
                      </Button>}
                  </div>

                  <div className="ml-0 sm:ml-16 pl-11 sm:pl-0">
                    <p className="text-xs sm:text-sm mb-2">{alert.message}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-xs text-muted-foreground">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-4">
                        <span className="truncate">Stock: {alert.currentStock}</span>
                        <span className="truncate">Threshold: {alert.threshold}</span>
                        <span className="truncate">Created: {safeFormatDate(alert.timestamp, 'dd/MM/yyyy HH:mm', 'Unknown date')}</span>
                      </div>
                      
                      {alert.acknowledged && alert.acknowledgedAt && <div className="flex items-center gap-1 text-success text-xs">
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            Acknowledged by {getAcknowledgedByName(alert.acknowledgedBy)} at{' '}
                            {safeFormatDate(alert.acknowledgedAt, 'dd/MM/yyyy HH:mm', 'Unknown date')}
                          </span>
                        </div>}
                    </div>
                  </div>
                </motion.div>)}
            
            {filteredAlerts.length > 50 && <div className="text-center py-3 sm:py-4 text-muted-foreground">
                <p className="text-xs sm:text-sm">Showing first 50 alerts. Use filters to narrow down results.</p>
              </div>}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default OptimizedAutomatedStockAlerts;
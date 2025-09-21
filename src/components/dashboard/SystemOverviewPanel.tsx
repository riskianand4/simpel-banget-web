import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Globe
} from 'lucide-react';
import { AdminActivity, CriticalAlert, LocationStats } from '@/hooks/useSuperAdminDashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

interface SystemOverviewPanelProps {
  activities: AdminActivity[];
  alerts: CriticalAlert[];
  locations: LocationStats[];
  loading?: boolean;
}

const SystemOverviewPanel: React.FC<SystemOverviewPanelProps> = ({
  activities,
  alerts,
  locations,
  loading
}) => {
  const isMobile = useIsMobile();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'low':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 98) return 'text-success';
    if (health >= 95) return 'text-primary';
    if (health >= 90) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthBgColor = (health: number) => {
    if (health >= 98) return 'bg-success';
    if (health >= 95) return 'bg-primary';
    if (health >= 90) return 'bg-warning';
    return 'bg-destructive';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
      {/* System Alerts Panel */}
      <Card className="h-full">
        <CardHeader className={isMobile ? "p-3 pb-2" : ""}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
            <AlertTriangle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-warning`} />
            {isMobile ? 'System Alerts' : 'Critical System Alerts'}
            <Badge 
              variant="outline" 
              className={`ml-auto ${isMobile ? 'text-xs px-1' : ''} ${
                alerts.filter(a => a.severity === 'critical').length > 0 ? 'border-destructive text-destructive' : 
                alerts.filter(a => a.severity === 'warning').length > 0 ? 'border-warning text-warning' :
                'border-success text-success'
              }`}
            >
              {alerts.filter(a => a.severity === 'critical').length || 'None'}
            </Badge>
          </CardTitle>
          <CardDescription className={isMobile ? 'text-xs' : ''}>
            Monitoring sistem dan notifikasi penting
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "p-3" : ""}>
          <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
            {alerts.length > 0 ? alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`flex items-start ${isMobile ? 'gap-2 p-2' : 'gap-3 p-3'} rounded-lg border transition-colors hover:bg-muted/50 ${
                  alert.severity === 'critical' ? 'bg-destructive/5 border-destructive/20' :
                  alert.severity === 'warning' ? 'bg-warning/5 border-warning/20' :
                  alert.severity === 'success' ? 'bg-success/5 border-success/20' :
                  'bg-muted/20 border-border'
                }`}
              >
                <div className="mt-2">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium leading-snug`}>
                    {alert.message}
                  </p>
                  <div className={`flex justify-between items-center ${isMobile ? 'mt-1' : 'mt-2'}`}>
                    <div>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                      <p className="text-xs text-muted-foreground">Affected: {alert.affected}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`text-xs py-1 px-2 h-auto ${isMobile ? 'text-xs' : ''}`}
                    >
                      {alert.action}
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Semua sistem berjalan normal</p>
              </div>
            )}
          </div>
          <Link to="/security">
            <Button variant="outline" className="w-full mt-8" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              View Security Center
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Admin Activity Monitor */}
      <Card>
        <CardHeader className={isMobile ? "p-3 pb-2" : ""}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
            <Eye className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            Admin Activity Monitor
            <Badge variant="outline" className={`ml-auto ${isMobile ? 'text-xs px-1' : ''}`}>
              {activities.length} recent
            </Badge>
          </CardTitle>
          <CardDescription className={isMobile ? 'text-xs' : ''}>
            Recent admin actions across all locations
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "p-3" : ""}>
          <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
            {activities.length > 0 ? activities.slice(0, 3).map((activity, index) => (
              <div 
                key={index} 
                className={`flex items-start ${isMobile ? 'gap-2 p-2' : 'gap-3 p-3'} rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors`}
              >
                <Shield className="h-4 w-4 mt-1 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                      {activity.admin}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRiskColor(activity.risk)}`}
                    >
                      {activity.risk} risk
                    </Badge>
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground leading-snug`}>
                    {activity.action}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {activity.location}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent admin activities</p>
              </div>
            )}
          </div>
          <Link to="/audit-log">
            <Button variant="outline" className="w-full mt-3" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              View Full Admin Log
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Multi-Location Oversight */}
      <Card className="lg:col-span-2">
        <CardHeader className={isMobile ? "p-3 pb-2" : ""}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
            <Globe className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            Multi-Location System Health
            <Badge variant="outline" className={`ml-auto ${isMobile ? 'text-xs px-1' : ''}`}>
              {locations.length} locations
            </Badge>
          </CardTitle>
          <CardDescription className={isMobile ? 'text-xs' : ''}>
            Global system health across all managed locations
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "p-3" : ""}>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
            {locations.map((location, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                  location.health >= 90 ? 'bg-success/5 border-success/20' :
                  location.health >= 70 ? 'bg-warning/5 border-warning/20' :
                  'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                    {location.location}
                  </p>
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold ${getHealthColor(location.health)}`}>
                    {location.health}%
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {location.products} items
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {location.alerts} alerts
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Health Score</span>
                    <span className={getHealthColor(location.health)}>
                      {location.health}%
                    </span>
                  </div>
                  <Progress 
                    value={location.health} 
                    className="h-2"
                  />
                </div>
                
                {location.alerts > 0 && (
                  <div className="mt-3 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-warning" />
                    <span className="text-xs text-warning">
                      Needs attention
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {locations.length === 0 && (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No locations configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemOverviewPanel;
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SystemMetric } from '@/hooks/useSuperAdminDashboard';
import { 
  Users, 
  Server, 
  AlertTriangle, 
  Database, 
  Shield, 
  Globe,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickStatsGridProps {
  metrics: SystemMetric[];
  loading?: boolean;
}

const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ metrics, loading }) => {
  const isMobile = useIsMobile();

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Users,
      Server,
      AlertTriangle,
      Database,
      Shield,
      Globe
    };
    return iconMap[iconName] || Users;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-success border-success/20 bg-success/5';
      case 'good':
        return 'text-primary border-primary/20 bg-primary/5';
      case 'warning':
        return 'text-warning border-warning/20 bg-warning/5';
      case 'critical':
        return 'text-destructive border-destructive/20 bg-destructive/5';
      default:
        return 'text-muted-foreground border-border bg-muted/5';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Good</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend.includes('↑') || trend.includes('+') || trend.includes('up') || trend.includes('stable')) {
      return <TrendingUp className="h-3 w-3 text-success" />;
    }
    if (trend.includes('↓') || trend.includes('-') || trend.includes('down')) {
      return <TrendingDown className="h-3 w-3 text-destructive" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
      {metrics.map((metric, index) => {
        const IconComponent = getIconComponent(metric.icon);
        const statusColorClass = getStatusColor(metric.status);
        
        return (
          <Card 
            key={index} 
            className={`hover:shadow-md transition-all duration-200 cursor-pointer ${statusColorClass} border-2`}
          >
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                      {metric.label}
                    </p>
                    {getStatusBadge(metric.status)}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                      {metric.value}
                    </p>
                    <IconComponent className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} opacity-70`} />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <p className={`text-xs ${
                      metric.trend.includes('stable') ? 'text-muted-foreground' :
                      metric.trend.includes('↑') || metric.trend.includes('+') ? 'text-success' :
                      metric.trend.includes('↓') || metric.trend.includes('-') ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {metric.trend}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Progress indicator for certain metrics */}
              {(metric.label.includes('Load') || metric.label.includes('Health')) && (
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        metric.status === 'excellent' ? 'bg-success' :
                        metric.status === 'good' ? 'bg-primary' :
                        metric.status === 'warning' ? 'bg-warning' :
                        'bg-destructive'
                      }`}
                      style={{
                        width: metric.label.includes('Load') ? 
                          `${100 - parseInt(metric.value)}%` : 
                          `${metric.status === 'excellent' ? 95 : metric.status === 'good' ? 80 : metric.status === 'warning' ? 60 : 30}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStatsGrid;
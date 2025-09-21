import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export const PSBTableSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const PSBAnalyticsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const PSBFullPageLoading: React.FC<{ message?: string }> = ({ 
  message = "Loading PSB data..." 
}) => (
  <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

export const PSBInlineLoading: React.FC<{ message?: string; size?: "sm" | "md" | "lg" }> = ({ 
  message = "Loading...",
  size = "md"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
};

// Loading overlay for forms
export const PSBFormLoading: React.FC<{ isVisible: boolean; message?: string }> = ({
  isVisible,
  message = "Saving..."
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

// Loading state for charts
export const PSBChartSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-end justify-between space-x-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="w-8" style={{ height: `${Math.random() * 200 + 50}px` }} />
        ))}
      </div>
    </CardContent>
  </Card>
);
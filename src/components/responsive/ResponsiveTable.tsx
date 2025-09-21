import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="mobile-table-container">
      <div className={cn('mobile-table-wrapper', className)}>
        {children}
      </div>
    </div>
  );
}

interface ResponsiveTableCardProps {
  data: Array<{ label: string; value: React.ReactNode; className?: string }>;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function ResponsiveTableCard({ 
  data, 
  title, 
  actions, 
  className 
}: ResponsiveTableCardProps) {
  return (
    <Card className={cn('mobile-card-compact', className)}>
      {title && (
        <div className="mobile-card-padding border-b border-border flex items-center justify-between">
          <h3 className="mobile-text-small font-medium">{title}</h3>
          {actions}
        </div>
      )}
      <div className="mobile-card-padding">
        <div className="mobile-spacing-tight">
          {data.map((item, index) => (
            <div key={index} className={cn("flex items-center justify-between py-1", item.className)}>
              <span className="mobile-text-small text-muted-foreground">{item.label}</span>
              <div className="mobile-text-small font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

interface ResponsiveTableHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function ResponsiveTableHeader({ 
  title, 
  description, 
  actions, 
  className 
}: ResponsiveTableHeaderProps) {
  return (
    <div className={cn('mobile-spacing-normal', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap-normal">
        <div>
          <h1 className="mobile-text-large font-bold">{title}</h1>
          {description && (
            <p className="mobile-text-small text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex mobile-gap-tight">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
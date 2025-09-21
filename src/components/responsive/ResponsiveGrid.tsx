import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  columns = { default: 1, sm: 2, lg: 3 },
  gap = 'normal',
  className 
}: ResponsiveGridProps) {
  const gridClasses = [
    // Base columns
    columns.default === 1 ? 'grid-cols-1' : 
    columns.default === 2 ? 'grid-cols-2' :
    columns.default === 3 ? 'grid-cols-3' :
    columns.default === 4 ? 'grid-cols-4' : 'grid-cols-1',
    
    // Small columns
    columns.sm === 1 ? 'sm:grid-cols-1' :
    columns.sm === 2 ? 'sm:grid-cols-2' :
    columns.sm === 3 ? 'sm:grid-cols-3' :
    columns.sm === 4 ? 'sm:grid-cols-4' : '',
    
    // Medium columns  
    columns.md === 1 ? 'md:grid-cols-1' :
    columns.md === 2 ? 'md:grid-cols-2' :
    columns.md === 3 ? 'md:grid-cols-3' :
    columns.md === 4 ? 'md:grid-cols-4' : '',
    
    // Large columns
    columns.lg === 1 ? 'lg:grid-cols-1' :
    columns.lg === 2 ? 'lg:grid-cols-2' :
    columns.lg === 3 ? 'lg:grid-cols-3' :
    columns.lg === 4 ? 'lg:grid-cols-4' : '',
    
    // XL columns
    columns.xl === 1 ? 'xl:grid-cols-1' :
    columns.xl === 2 ? 'xl:grid-cols-2' :
    columns.xl === 3 ? 'xl:grid-cols-3' :
    columns.xl === 4 ? 'xl:grid-cols-4' : '',
  ].filter(Boolean);

  const gapClass = 
    gap === 'tight' ? 'mobile-gap-tight' :
    gap === 'loose' ? 'mobile-gap-loose' : 'mobile-gap-normal';

  return (
    <div className={cn('grid', ...gridClasses, gapClass, className)}>
      {children}
    </div>
  );
}

export function ResponsiveContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('mobile-content-container', className)}>
      {children}
    </div>
  );
}

export function ResponsiveStack({ 
  children, 
  spacing = 'normal',
  className 
}: { 
  children: React.ReactNode;
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}) {
  const spacingClass = 
    spacing === 'tight' ? 'mobile-spacing-tight' :
    spacing === 'loose' ? 'mobile-spacing-loose' : 'mobile-spacing-normal';

  return (
    <div className={cn(spacingClass, className)}>
      {children}
    </div>
  );
}

export function ResponsiveCard({ 
  children, 
  padding = 'normal',
  className 
}: { 
  children: React.ReactNode;
  padding?: 'compact' | 'normal' | 'loose';
  className?: string;
}) {
  const paddingClass = 
    padding === 'compact' ? 'mobile-padding-compact' :
    padding === 'loose' ? 'mobile-padding-loose' : 'mobile-padding-normal';

  return (
    <div className={cn('mobile-card-compact', paddingClass, className)}>
      {children}
    </div>
  );
}
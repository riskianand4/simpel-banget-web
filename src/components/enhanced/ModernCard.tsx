import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  variant?: 'default' | 'glass' | 'gradient' | 'glow';
  children: React.ReactNode;
  className?: string;
}

const ModernCard: React.FC<ModernCardProps> = ({ 
  variant = 'default', 
  className, 
  children
}) => {
  const variantClasses = {
    default: 'modern-card hover-lift',
    glass: 'glass hover-lift',
    gradient: 'bg-gradient-to-br from-card to-card/50 border hover-lift',
    glow: 'modern-card primary-glow hover-lift'
  };

  return (
    <Card 
      className={cn(variantClasses[variant], className)}
    >
      {children}
    </Card>
  );
};

export default ModernCard;
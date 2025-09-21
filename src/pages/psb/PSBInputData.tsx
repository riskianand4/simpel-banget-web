import React, { useState } from 'react';
import { PSBInputDialog } from '@/components/psb/PSBInputDialog';
import { RecentPSBOrders } from '@/components/psb/RecentPSBOrders';

export const PSBInputData: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOrderCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-3 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Input Data PSB
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 px-2 sm:px-0">
            Kelola data order PSB dengan mudah dan praktis
          </p>
        </div>
        
        <div className="w-full sm:w-auto">
          <PSBInputDialog onOrderCreated={handleOrderCreated} />
        </div>
      </div>
      
      <div className="w-full">
        <RecentPSBOrders refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};
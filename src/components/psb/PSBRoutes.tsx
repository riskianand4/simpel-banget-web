import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PSBDashboard } from '@/pages/psb/PSBDashboard';
import { PSBInputData } from '@/pages/psb/PSBInputData';
import { PSBCustomers } from '@/pages/psb/PSBCustomers';
import { PSBReports } from '@/pages/psb/PSBReports';
import { PSBAnalytics } from '@/pages/psb/PSBAnalytics';
import { PSBDataManagement } from '@/pages/psb/PSBDataManagement';
import { PSBDebugPage } from '@/pages/psb/PSBDebugPage';

export const PSBRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<PSBDashboard />} />
      <Route path="input" element={<PSBInputData />} />
      <Route path="customers" element={<PSBCustomers />} />
      <Route path="reports" element={<PSBReports />} />
      <Route path="analytics" element={<PSBAnalytics />} />
      <Route path="data" element={<PSBDataManagement />} />
      <Route path="debug" element={<PSBDebugPage />} />
    </Routes>
  );
};
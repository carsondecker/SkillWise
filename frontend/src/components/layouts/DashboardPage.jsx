import React from 'react';
import DashboardLayout from './DashboardLayout';

const DashboardPage = ({ title, subtitle, children }) => {
  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      {children}
    </DashboardLayout>
  );
};

export default DashboardPage;

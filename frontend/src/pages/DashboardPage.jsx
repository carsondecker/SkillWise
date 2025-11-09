// src/pages/DashboardPage.jsx
import React, { useEffect } from 'react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import { useLayout } from '../contexts/LayoutContext';

const DashboardPage = () => {
  const { setTitle, setSubtitle } = useLayout();

  useEffect(() => {
    setTitle('Overview');
    setSubtitle('Your learning snapshot');
  }, [setTitle, setSubtitle]);

  return <DashboardOverview />;
};

export default DashboardPage;

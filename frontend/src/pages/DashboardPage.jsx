// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import '../styles/DashboardPage.scss';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <main className="dashboard-main">
          <DashboardOverview />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

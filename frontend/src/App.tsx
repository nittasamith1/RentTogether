import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route
                path="explore"
                element={
                  <PlaceholderPage
                    title="Resource Marketplace"
                    description="Browse, filter, and discover academic resources across campus."
                    phase="Phase 04"
                  />
                }
              />
              <Route
                path="rentals"
                element={
                  <PlaceholderPage
                    title="My Rentals"
                    description="Track items you are currently borrowing, return schedules, and savings."
                    phase="Phase 07"
                  />
                }
              />
              <Route
                path="listings"
                element={
                  <PlaceholderPage
                    title="My Listings & Inventory"
                    description="Manage your shared resources, toggle availability, and track rental earnings."
                    phase="Phase 05"
                  />
                }
              />
              <Route
                path="bookings"
                element={
                  <PlaceholderPage
                    title="Rental Bookings & Calendar"
                    description="Manage incoming and outgoing booking requests with conflict-free scheduling."
                    phase="Phase 06 & 07"
                  />
                }
              />
              <Route
                path="ai-insights"
                element={
                  <PlaceholderPage
                    title="AI Insights & Demand Forecasting"
                    description="AI-driven fair pricing suggestions and upcoming campus exam/project demand forecasts."
                    phase="Phase 10 & 11"
                  />
                }
              />
              <Route
                path="sustainability"
                element={
                  <PlaceholderPage
                    title="Campus Sustainability Analytics"
                    description="View in-depth campus environmental metrics: e-waste avoided and student money saved."
                    phase="Phase 14"
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <PlaceholderPage
                    title="Account & Campus Settings"
                    description="Manage your institutional email, notifications, and profile details."
                    phase="Phase 03"
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;


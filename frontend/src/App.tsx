import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { VerificationPendingPage } from './pages/auth/VerificationPendingPage';
import { AdminVerificationsPage } from './pages/admin/AdminVerificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

// Guard: Allows access only to authenticated & college-verified students (or campus admin)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isVerified, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="w-7 h-7 border-3 border-neutral-300 border-t-[#F5A623] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!isVerified) {
    return <Navigate to={`/verification-pending?email=${encodeURIComponent(user.email)}`} replace />;
  }

  return <>{children}</>;
};

// Guard: Allows access only to campus administrators
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="w-7 h-7 border-3 border-neutral-300 border-t-[#F5A623] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !user.is_staff) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Guard: Accessible only to unauthenticated visitors (e.g. login/register)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isVerified, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    if (isVerified) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to={`/verification-pending?email=${encodeURIComponent(user.email)}`} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Pages */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyOtpPage />} />
            <Route path="/verification-pending" element={<VerificationPendingPage />} />

            {/* Main Application with AppLayout (Protected) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
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

              {/* Admin Portal within AppLayout */}
              <Route
                path="admin/verifications"
                element={
                  <AdminRoute>
                    <AdminVerificationsPage />
                  </AdminRoute>
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

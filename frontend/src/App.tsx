import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { AppLayout } from './components/layout/AppLayout';

// Eagerly imported pages for 0ms instantaneous navigation with zero full-page reloads or flickers
import { DashboardPage } from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { WishlistPage } from './pages/WishlistPage';
import { MyListingsPage } from './pages/listings/MyListingsPage';
import { CreateListingPage } from './pages/listings/CreateListingPage';
import { BookingsCalendarPage } from './pages/BookingsCalendarPage';
import { MyRentalsPage } from './pages/rentals/MyRentalsPage';
import { PaymentsEscrowPage } from './pages/payments/PaymentsEscrowPage';
import { SettingsPage } from './pages/settings/SettingsPage';
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
        <DialogProvider>
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
                <Route path="marketplace" element={<MarketplacePage />} />
                <Route path="explore" element={<MarketplacePage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="rentals" element={<MyRentalsPage />} />
                <Route path="listings" element={<MyListingsPage />} />
                <Route path="listings/create" element={<CreateListingPage />} />
                <Route path="listings/new" element={<CreateListingPage />} />
                <Route path="bookings" element={<BookingsCalendarPage />} />
                <Route path="calendar" element={<Navigate to="/bookings" replace />} />
                <Route path="payments" element={<PaymentsEscrowPage />} />
                <Route path="escrow" element={<Navigate to="/payments" replace />} />
                <Route path="insights" element={<AnalyticsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="ai-insights" element={<AnalyticsPage />} />
                <Route path="sustainability" element={<AnalyticsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/:id" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />

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
        </DialogProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

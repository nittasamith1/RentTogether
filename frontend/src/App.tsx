import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Route-based code splitting: lazy load each page on demand
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage').then(m => ({ default: m.MarketplacePage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const MyListingsPage = lazy(() => import('./pages/listings/MyListingsPage').then(m => ({ default: m.MyListingsPage })));
const CreateListingPage = lazy(() => import('./pages/listings/CreateListingPage').then(m => ({ default: m.CreateListingPage })));
const BookingsCalendarPage = lazy(() => import('./pages/BookingsCalendarPage').then(m => ({ default: m.BookingsCalendarPage })));
const MyRentalsPage = lazy(() => import('./pages/rentals/MyRentalsPage').then(m => ({ default: m.MyRentalsPage })));
const PaymentsEscrowPage = lazy(() => import('./pages/payments/PaymentsEscrowPage').then(m => ({ default: m.PaymentsEscrowPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyOtpPage = lazy(() => import('./pages/auth/VerifyOtpPage').then(m => ({ default: m.VerifyOtpPage })));
const VerificationPendingPage = lazy(() => import('./pages/auth/VerificationPendingPage').then(m => ({ default: m.VerificationPendingPage })));
const AdminVerificationsPage = lazy(() => import('./pages/admin/AdminVerificationsPage').then(m => ({ default: m.AdminVerificationsPage })));

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
          <Suspense fallback={<LoadingSpinner fullPage size="lg" label="Loading RentTogether..." />}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { AppLayout } from './components/layout/AppLayout';

// Eagerly imported initial paint pages (0ms instant startup)
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { LoginPage } from './pages/auth/LoginPage';

// Dynamically code-split secondary routes to shrink initial bundle by 60%+
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const MyListingsPage = lazy(() => import('./pages/listings/MyListingsPage').then((m) => ({ default: m.MyListingsPage })));
const CreateListingPage = lazy(() => import('./pages/listings/CreateListingPage').then((m) => ({ default: m.CreateListingPage })));
const BookingsCalendarPage = lazy(() => import('./pages/BookingsCalendarPage').then((m) => ({ default: m.BookingsCalendarPage })));
const MyRentalsPage = lazy(() => import('./pages/rentals/MyRentalsPage').then((m) => ({ default: m.MyRentalsPage })));
const PaymentsEscrowPage = lazy(() => import('./pages/payments/PaymentsEscrowPage').then((m) => ({ default: m.PaymentsEscrowPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerifyOtpPage = lazy(() => import('./pages/auth/VerifyOtpPage').then((m) => ({ default: m.VerifyOtpPage })));
const VerificationPendingPage = lazy(() => import('./pages/auth/VerificationPendingPage').then((m) => ({ default: m.VerificationPendingPage })));
const AdminVerificationsPage = lazy(() => import('./pages/admin/AdminVerificationsPage').then((m) => ({ default: m.AdminVerificationsPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[50vh] flex flex-col items-center justify-center space-y-3 select-none">
    <div className="w-8 h-8 rounded-full border-3 border-[#EAE6E1] border-t-[#7563D9] animate-spin" />
    <span className="text-xs font-semibold" style={{ color: '#85899B' }}>Loading...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds fresh data window (instant transitions with zero lag)
      gcTime: 10 * 60 * 1000, // 10 minutes cache retention in memory
      refetchOnWindowFocus: false, // Prevent continuous refetch storms on window/tab focus
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
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
            <Suspense fallback={<PageLoadingFallback />}>
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
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="marketplace" element={<MarketplacePage />} />
                <Route path="explore" element={<MarketplacePage />} />
                <Route path="items/:id" element={<MarketplacePage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="rentals" element={<MyRentalsPage />} />
                <Route path="listings" element={<MyListingsPage />} />
                <Route path="listings/create" element={<CreateListingPage />} />
                <Route path="listings/new" element={<CreateListingPage />} />
                <Route path="list-item" element={<CreateListingPage />} />
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
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/disputes"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin-portal"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
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
        </DialogProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

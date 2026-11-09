import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthUser } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  login: (access: string, refresh: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
  checkVerificationStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      const hasToken = localStorage.getItem('access_token') || localStorage.getItem('refresh_token');
      if (stored && hasToken) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  });

  const isLoading = false;

  const isAuthenticated = Boolean(user && (user.email_verified || user.is_staff));
  const isVerified = Boolean(user && (user.is_college_verified || user.is_staff));

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback((access: string, refresh: string, userData: AuthUser) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Continue with local clear even if network/token fails
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const checkVerificationStatus = useCallback(async () => {
    if (!user) return;
    try {
      const statusRes = await authService.getVerificationStatus(user.email);
      if (statusRes && statusRes.verification_status) {
        const isCollegeVerified = statusRes.verification_status === 'VERIFIED';
        updateUser({
          verification_status: statusRes.verification_status,
          is_college_verified: isCollegeVerified,
        });
      }
    } catch {
      // Silently fail on polling error
    }
  }, [user, updateUser]);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }, [user]);

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    isVerified,
    isLoading,
    login,
    logout,
    updateUser,
    checkVerificationStatus,
  }), [user, isAuthenticated, isVerified, isLoading, login, logout, updateUser, checkVerificationStatus]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

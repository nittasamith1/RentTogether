import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Initial fallback demo student (matching dashboard mockup) if user hasn't logged in yet
const DEFAULT_DEMO_STUDENT: AuthUser = {
  id: 'demo-sai-id',
  email: 'sai.reddy@vnrvjiet.in',
  name: 'Sai Reddy',
  first_name: 'Sai',
  last_name: 'Reddy',
  college_code: 'VNRVJIET',
  college_name: 'VNR Vignana Jyothi Institute of Engineering & Technology',
  email_verified: true,
  is_college_verified: true,
  verification_status: 'VERIFIED',
  is_staff: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parsing errors
    }
    // Check if token exists
    const token = localStorage.getItem('access_token');
    if (token) {
      return null;
    }
    // Default to demo student for preview experience
    return DEFAULT_DEMO_STUDENT;
  });

  const isLoading = false;

  const isAuthenticated = Boolean(user && (user.email_verified || user.is_staff));
  const isVerified = Boolean(user && (user.is_college_verified || user.is_staff));

  const login = (access: string, refresh: string, userData: AuthUser) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
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
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  const checkVerificationStatus = async () => {
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
  };

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isVerified,
        isLoading,
        login,
        logout,
        updateUser,
        checkVerificationStatus,
      }}
    >
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

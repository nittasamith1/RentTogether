import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Default demo student matching mockup for initial development preview
    return {
      id: 'mock-sai-id',
      email: 'sai.reddy@vnrvjiet.in',
      username: 'saireddy',
      full_name: 'Sai Reddy',
      is_college_verified: true,
      college: {
        id: 'mock-college-id',
        name: 'VNR Vignana Jyothi Institute of Engineering & Technology',
        code: 'VNRVJIET',
        domain_whitelist: ['vnrvjiet.in', 'vnrvjiet.ac.in', 'college.edu'],
        is_active: true,
      },
      date_joined: new Date().toISOString(),
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const login = (access: string, refresh: string, userData: User) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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

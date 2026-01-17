import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/services/api';
import { isAuthenticated, setAuthToken, clearAuthToken } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    // In a real app, you'd verify the token with the server
    const checkAuth = async () => {
      if (isAuthenticated()) {
        // TODO: Call getCurrentUser() to verify token and get user data
        // For now, we'll just check if token exists
        // const userData = await getCurrentUser();
        // setUser(userData);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback((userData: User, token: string) => {
    setAuthToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

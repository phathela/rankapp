import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAuthToken, getAuthToken, removeAuthToken, User } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiClient.get<User>('/auth/profile');
      setUser(userData);
    } catch {
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    setAuthToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const response = await apiClient.post<{ token: string; user: User }>(
        '/auth/register',
        {
          email,
          username,
          password,
        }
      );
      setAuthToken(response.token);
      setUser(response.user);
    },
    []
  );

  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
    window.location.href = '/';
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiClient.get<User>('/auth/profile');
      setUser(userData);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

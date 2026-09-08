'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, getToken, setToken, removeToken, apiFetch, LoginResponse, MeResponse } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  role: string | null;
  isReadOnly: boolean;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const role = user?.role || null;
  const isReadOnly = role === 'ReadOnly';

  const logout = useCallback(() => {
    removeToken();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('read_only_modal_shown');
    }
    setTokenState(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    setTokenState(existingToken);
    apiFetch<MeResponse>('/api/auth/me')
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [logout]);

  const login = async (username: string, password: string) => {
    const data = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    setToken(data.access_token);
    setTokenState(data.access_token);
    setUser(data.user);
    router.push('/hosted-zones');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isReadOnly,
        token,
        isAuthenticated: !!user,
        isLoading,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

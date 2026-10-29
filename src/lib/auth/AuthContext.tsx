'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { StorageService } from '@/lib/data/storage';
import { UserProfile } from '@/lib/types';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'secretaria' | string;
  status: 'active' | 'inactive' | 'invited';
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isSecretaria: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncToStorage = (u: AuthUser | null) => {
    if (u) {
      const profile: UserProfile = {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role as any,
        phone: u.phone || '',
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        avatar_url: '/assets/logo.png',
        discount_limit_pct: u.role === 'admin' ? 100 : 20,
      };
      StorageService.setCurrentUser(profile);
    } else {
      StorageService.logout();
    }
  };

  const checkSession = async () => {
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        syncToStorage(data.user);
      } else {
        setUser(null);
        syncToStorage(null);
        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
    } catch {
      // Fallback local en caso de error de red puntual
      const local = StorageService.getCurrentUser();
      if (local) {
        setUser({
          id: local.id,
          email: local.email,
          full_name: local.full_name,
          role: local.role,
          status: 'active',
          phone: local.phone,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [pathname]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        syncToStorage(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }
    } catch (err: any) {
      return { success: false, error: 'No se pudo conectar con el servidor de autenticación.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      syncToStorage(null);
      router.replace('/login');
    }
  };

  const refreshUser = async () => {
    await checkSession();
  };

  const isAdmin = user?.role === 'admin';
  const isSecretaria = user?.role === 'secretaria';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSecretaria,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

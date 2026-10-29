'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Zap, Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-amber-400 flex items-center justify-center shadow-md mb-4 animate-pulse">
          <Zap className="w-7 h-7 fill-amber-400" />
        </div>
        <p className="text-sm font-bold text-slate-800">ElectroCotiza</p>
        <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Cargando sistema...</span>
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

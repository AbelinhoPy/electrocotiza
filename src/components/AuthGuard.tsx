'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, ShieldCheck } from 'lucide-react';
import { StorageService } from '@/lib/data/storage';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    // Si la ruta es login, no requiere verificación de sesión
    if (pathname === '/login') {
      setIsAuthorized(true);
      setChecking(false);
      return;
    }

    // Verificar si el usuario está autenticado
    const user = StorageService.getCurrentUser();
    if (!user) {
      setIsAuthorized(false);
      setChecking(false);
      router.replace('/login');
    } else {
      setIsAuthorized(true);
      setChecking(false);
    }
  }, [pathname, router]);

  // Si está en /login, permitir renderizar inmediatamente
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Pantalla de carga nativa móvil (Splash Screen) mientras verifica sesión
  if (checking || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#070D18] via-[#0B1526] to-[#050B14] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-amber-500/40 animate-pulse">
            <Zap className="w-12 h-12 text-slate-950 fill-slate-950" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#0B1526] p-1 rounded-full">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white">
          Electro<span className="text-amber-400">Cotiza</span>
        </h1>
        <p className="text-xs font-semibold text-amber-300/90 mt-1 uppercase tracking-wider">
          Construlogica Emprendimientos S.A.
        </p>

        <div className="flex items-center space-x-2 mt-6 text-xs text-slate-400 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Verificando credenciales de obra...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

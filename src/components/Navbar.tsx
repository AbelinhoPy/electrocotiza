'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Zap, 
  Search, 
  FileText, 
  UploadCloud, 
  Building2, 
  Settings as SettingsIcon,
  PlusCircle,
  Briefcase,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { UserProfile } from '@/lib/types';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setCurrentUser(StorageService.getCurrentUser());
  }, [pathname]);

  const handleLogout = () => {
    StorageService.logout();
    router.replace('/login');
  };

  // No mostrar navbar en login
  if (pathname === '/login') return null;

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Zap },
    { href: '/catalogo', label: 'Precios', icon: Search },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { href: '/ingesta', label: 'Facturas', icon: UploadCloud },
    { href: '/empresa', label: 'Mi Empresa', icon: Briefcase },
    { href: '/proveedores', label: 'Proveedores', icon: Building2 },
    { href: '/configuracion', label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B1526]/95 backdrop-blur-md text-white border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* LOGO & BRANDING MÓVIL Y DESKTOP */}
          <Link href="/" className="flex items-center space-x-2.5 group shrink-0 active:scale-95 transition-transform">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-black text-base sm:text-lg text-white tracking-tight">
                  Electro<span className="text-amber-400">Cotiza</span>
                </span>
                <span className="text-[9px] uppercase font-black bg-amber-400/20 text-amber-300 px-1 py-0.2 rounded border border-amber-400/30">
                  PY
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold truncate max-w-[150px] sm:max-w-xs leading-none">
                Construlogica Emprendimientos S.A.
              </p>
            </div>
          </Link>

          {/* NAVEGACIÓN DESKTOP */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* PERFIL MÓVIL Y BOTÓN DE CIERRE DE SESIÓN */}
          <div className="flex items-center space-x-2">
            
            {/* Botón Desktop Nueva Cotización */}
            <Link
              href="/presupuestos/nuevo"
              className="hidden sm:inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cotizar Obra</span>
            </Link>

            {/* AVATAR Y PERFIL DEL USUARIO */}
            {currentUser && (
              <div className="flex items-center space-x-1.5 sm:space-x-2 pl-2 sm:border-l sm:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-xs font-black">
                  {currentUser.full_name.substring(0, 2).toUpperCase()}
                </div>

                <div className="hidden md:block text-left">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[9px] text-amber-400 font-mono font-bold block uppercase">
                    {currentUser.role === 'owner' ? 'Jefe de Obra' : currentUser.role}
                  </span>
                </div>

                {/* BOTÓN CERRAR SESIÓN (SIEMPRE VISIBLE EN MÓVIL Y PC) */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700/80 hover:border-red-500/40 text-xs font-bold transition-all flex items-center space-x-1 active:scale-95"
                  title="Cerrar turno de obra / Salir al login"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-400 hover:text-red-400" />
                  <span className="hidden sm:inline text-[11px]">Salir</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

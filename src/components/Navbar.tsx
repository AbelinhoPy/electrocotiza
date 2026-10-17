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
  User
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
    router.push('/login');
  };

  // No mostrar navbar en login
  if (pathname === '/login') return null;

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Zap },
    { href: '/catalogo', label: 'Buscador y Precios', icon: Search },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { href: '/ingesta', label: 'Escanear Facturas', icon: UploadCloud },
    { href: '/empresa', label: 'Mi Empresa', icon: Briefcase },
    { href: '/proveedores', label: 'Proveedores', icon: Building2 },
    { href: '/configuracion', label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0F2137] text-white border-b border-slate-700/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Branding */}
          <Link href="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">Electro<span className="text-amber-400">Cotiza</span></span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">PY</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate max-w-[170px] sm:max-w-xs">
                Construlogica Emprendimientos S.A.
              </p>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
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

          {/* Botones de Usuario y Acción Rápida */}
          <div className="flex items-center space-x-3">
            <Link
              href="/presupuestos/nuevo"
              className="hidden sm:inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cotizar Obra</span>
            </Link>

            {/* Perfil Usuario y Logout */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700/80">
                <div className="hidden md:block text-right">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">
                    {currentUser.role === 'owner' ? 'Jefe de Obra' : currentUser.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

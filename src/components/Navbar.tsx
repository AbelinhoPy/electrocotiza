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
  Layers,
  Wrench,
  ShieldCheck,
  BarChart3,
  Users,
  LogOut,
  User,
  ChevronDown,
  Shield,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { UserProfile } from '@/lib/types';
import { DEMO_USERS } from '@/lib/data/initial-data';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  useEffect(() => {
    setCurrentUser(StorageService.getCurrentUser());
  }, [pathname]);

  const handleLogout = () => {
    StorageService.logout();
    router.replace('/login');
  };

  const handleSwitchUser = (user: UserProfile) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    setShowRoleSwitcher(false);
    window.location.reload();
  };

  if (pathname === '/login') return null;

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Zap },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { href: '/proyectos', label: 'Proyectos', icon: Briefcase },
    { href: '/finanzas', label: 'Finanzas', icon: DollarSign },
    { href: '/catalogo', label: 'Precios', icon: Search },
    { href: '/inventario', label: 'Inventario', icon: Layers },
    { href: '/ordenes-servicio', label: 'Órdenes', icon: Wrench },
    { href: '/checklists', label: 'Checklists', icon: ShieldCheck },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/proveedores', label: 'Proveedores', icon: Building2 },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
    { href: '/importador-xml', label: 'XML SIFEN', icon: FileSpreadsheet },
    { href: '/ingesta', label: 'Facturas', icon: UploadCloud },
    { href: '/configuracion', label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B1526]/95 backdrop-blur-md text-white border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* LOGO & BRANDING */}
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

          {/* NAVEGACIÓN DESKTOP COMPLETA CON SCROLL HORIZONTAL SI SE REQUIERE */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
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

          {/* PERFIL, ROLE SWITCHER Y ACCIONES RÁPIDAS */}
          <div className="flex items-center space-x-2">
            
            {/* Botón Nueva Cotización */}
            <Link
              href="/presupuestos/nuevo"
              className="hidden sm:inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cotizar Obra</span>
            </Link>

            {/* SELECTOR DE ROL / PERFIL RBAC */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                    {currentUser.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <span className="text-xs font-bold text-white block leading-tight truncate max-w-[110px]">
                      {currentUser.full_name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-amber-400 font-mono font-bold block uppercase leading-none">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showRoleSwitcher && (
                  <div className="absolute right-0 mt-2 z-50 bg-[#0F2137] border border-slate-700 rounded-xl shadow-2xl p-2 w-64 text-left space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black px-2 py-1 block">
                      Cambiar Rol / Perfil RBAC:
                    </span>
                    {DEMO_USERS.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currentUser.id === u.id ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <span className="block truncate leading-tight">{u.full_name}</span>
                          <span className="text-[10px] font-mono opacity-80 uppercase">{u.role}</span>
                        </div>
                        {currentUser.id === u.id && <span>✓</span>}
                      </button>
                    ))}

                    <div className="border-t border-slate-800 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center space-x-1 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

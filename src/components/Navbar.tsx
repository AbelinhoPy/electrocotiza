'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  FileText, 
  Package, 
  Users, 
  Receipt, 
  ChevronDown, 
  LogOut, 
  Menu, 
  X, 
  Briefcase, 
  Layers, 
  Wrench, 
  ShieldCheck, 
  BarChart3, 
  Building2, 
  DollarSign, 
  FileSpreadsheet, 
  Settings as SettingsIcon,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  if (pathname === '/login') return null;

  // Enlaces principales visibles para todos (Secretaria y Admin)
  const mainLinks = [
    { href: '/', label: 'Inicio', icon: Zap },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { href: '/catalogo', label: 'Productos y precios', icon: Package },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/ingesta', label: 'Facturas de compra', icon: Receipt },
  ];

  // Enlaces agrupados bajo "Más opciones"
  const secondaryLinks = [
    { href: '/proyectos', label: 'Proyectos y obras', icon: Briefcase },
    { href: '/finanzas', label: 'Finanzas y cobranzas', icon: DollarSign },
    { href: '/inventario', label: 'Inventario de almacenes', icon: Layers },
    { href: '/ordenes-servicio', label: 'Órdenes de servicio', icon: Wrench },
    { href: '/checklists', label: 'Checklists ANDE', icon: ShieldCheck },
    { href: '/proveedores', label: 'Proveedores', icon: Building2 },
    { href: '/importador-xml', label: 'Importador XML SIFEN', icon: FileSpreadsheet },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  ];

  const adminLinks = [
    { href: '/usuarios', label: 'Usuarios', icon: UserCheck },
    { href: '/configuracion', label: 'Configuración', icon: SettingsIcon },
  ];

  const roleLabel = isAdmin ? 'Administrador' : user?.role === 'secretaria' ? 'Secretaria' : user?.role || 'Usuario';

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center space-x-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-none block">
                Electro<span className="text-amber-400">Cotiza</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">
                Construlogica S.A.
              </span>
            </div>
          </Link>

          {/* NAVEGACIÓN ESCRITORIO */}
          <nav className="hidden lg:flex items-center space-x-1">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* MENÚ MÁS MÓDULOS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span>Más</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMoreDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Módulos Operativos
                    </div>
                    {secondaryLinks.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsMoreDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <SubIcon className="w-4 h-4 text-slate-400" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}

                    {isAdmin && (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-b border-slate-100 mt-1">
                          Administración
                        </div>
                        {adminLinks.map((adm) => {
                          const AdmIcon = adm.icon;
                          return (
                            <Link
                              key={adm.href}
                              href={adm.href}
                              onClick={() => setIsMoreDropdownOpen(false)}
                              className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <AdmIcon className="w-4 h-4 text-slate-400" />
                              <span>{adm.label}</span>
                            </Link>
                          );
                        })}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* LINK DIRECTO A USUARIOS PARA ADMIN */}
            {isAdmin && (
              <Link
                href="/usuarios"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  pathname.startsWith('/usuarios')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Usuarios</span>
              </Link>
            )}
          </nav>

          {/* PERFIL DE USUARIO & CERRAR SESIÓN */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <span className="text-xs font-bold text-white block leading-tight">
                {user?.full_name || 'Usuario'}
              </span>
              <span className="text-[10px] font-medium text-amber-400 block leading-tight">
                {roleLabel}
              </span>
            </div>

            <button
              onClick={() => logout()}
              title="Cerrar sesión"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>

          {/* BOTÓN HAMBURGUESA MÓVIL */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* MENÚ MÓVIL (DRAWER DESPLEGABLE) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0F172A] border-t border-slate-800 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2">
          {/* Identidad del usuario móvil */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-sm font-bold text-white block">
                {user?.full_name}
              </span>
              <span className="text-xs text-amber-400 font-medium block">
                {roleLabel}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Menú Principal
            </div>
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Más Módulos
            </div>
            {secondaryLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Administración
              </div>
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-slate-800"
                  >
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

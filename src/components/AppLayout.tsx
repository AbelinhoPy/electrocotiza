'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  Home, 
  FileText, 
  Package, 
  Users, 
  Receipt, 
  Briefcase, 
  Layers, 
  Wrench, 
  ShieldCheck, 
  BarChart3, 
  UserCheck, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  Building2,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getUserDisplayName } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, isAdmin, isSecretaria, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(true);

  // Si estamos en la página de login, no mostramos el layout autenticado
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const { first: firstName, full: fullName } = getUserDisplayName(user?.full_name);
  const roleLabel = isAdmin ? 'Administrador' : isSecretaria ? 'Secretaría' : user?.role || 'Personal';

  const mainNav = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { href: '/catalogo', label: 'Productos y precios', icon: Package },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/ingesta', label: 'Facturas de compra', icon: Receipt },
  ];

  const secondaryNav = [
    { href: '/proyectos', label: 'Proyectos y obras', icon: Briefcase },
    { href: '/inventario', label: 'Inventario', icon: Layers },
    { href: '/ordenes-servicio', label: 'Órdenes de servicio', icon: Wrench },
    { href: '/checklists', label: 'Checklists ANDE', icon: ShieldCheck },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  ];

  const adminNav = [
    { href: '/usuarios', label: 'Usuarios', icon: UserCheck },
    { href: '/configuracion', label: 'Configuración', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    if (confirm('¿Deseas cerrar tu sesión en ElectroCotiza?')) {
      await logout();
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900">
      
      {/* ========================================================= */}
      {/* 1. BARRA SUPERIOR PARA MÓVILES (< lg)                      */}
      {/* ========================================================= */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0F172A] text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow">
            <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-base text-white tracking-tight leading-none block">
              Electro<span className="text-amber-400">Cotiza</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">
              Construlogica S.A.
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Badge del usuario */}
          <div className="text-right">
            <span className="text-xs font-bold text-slate-200 block leading-tight">{firstName}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block ${
              isAdmin ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {roleLabel}
            </span>
          </div>

          {/* Botón menú hamburguesa */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MENÚ DESPLEGABLE / DRAWER MÓVIL (< lg)                 */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex">
          <div className="w-4/5 max-w-xs bg-[#0F172A] text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Cabecera del drawer */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-white block">ElectroCotiza</span>
                  <span className="text-[10px] text-slate-400 block">{fullName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de navegación móvil */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
                  Menú Principal
                </p>
                <div className="space-y-1">
                  {mainNav.map(item => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          active ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-amber-400" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
                  Operaciones y Obras
                </p>
                <div className="space-y-1">
                  {secondaryNav.map(item => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          active ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {isAdmin && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 mb-1">
                    Administración
                  </p>
                  <div className="space-y-1">
                    {adminNav.map(item => {
                      const Icon = item.icon;
                      const active = isLinkActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            active ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-400" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Botón visible de cerrar sesión en móvil */}
            <div className="p-3 border-t border-slate-800 bg-[#0B1526]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Cierra menú al hacer tap fuera */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SIDEBAR PERMANENTE PARA ESCRITORIO (lg:flex)            */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0F172A] text-white border-r border-slate-800 shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Marca Oficial */}
        <div className="p-5 border-b border-slate-800">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight leading-none block">
                Electro<span className="text-amber-400">Cotiza</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-none block mt-1">
                Construlogica S.A.
              </span>
            </div>
          </Link>

          {/* Tarjeta de usuario autenticado */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-slate-600">
              {fullName ? fullName.substring(0, 2).toUpperCase() : 'EC'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                {fullName}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                isAdmin ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Enlaces de Navegación */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-semibold">
          {/* Módulos Principales */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Menú Principal
            </p>
            <div className="space-y-1">
              {mainNav.map(item => {
                const Icon = item.icon;
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
                      active
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-amber-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Módulos Secundarios (En "Más") */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1 cursor-pointer" onClick={() => setMoreOpen(!moreOpen)}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operaciones y Obras
              </p>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </div>

            {moreOpen && (
              <div className="space-y-1">
                {secondaryNav.map(item => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-1.5 rounded-xl transition-all ${
                        active
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Solo para Administrador */}
          {isAdmin && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 mb-1">
                Solo Administrador
              </p>
              <div className="space-y-1">
                {adminNav.map(item => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
                        active
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Botón visible Cerrar Sesión en Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-[#0B1526]/80">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-rose-950/60 border border-slate-700/60 hover:border-rose-800/60 text-slate-300 hover:text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-sm group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. CONTENIDO PRINCIPAL CON HEADER SUPERIOR (DESKTOP)       */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Encabezado superior en escritorio */}
        <header className="hidden lg:flex items-center justify-between h-14 bg-white border-b border-slate-200 px-6 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Sesión activa:</span>
            <span className="text-xs font-bold text-slate-800">{fullName}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              isAdmin ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Área de contenido de página */}
        <main className="flex-1 pb-12 lg:pb-8">
          {children}
        </main>
      </div>

    </div>
  );
}

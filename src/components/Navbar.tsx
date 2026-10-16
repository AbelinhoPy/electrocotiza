'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  Search, 
  FileText, 
  UploadCloud, 
  Building2, 
  Settings as SettingsIcon,
  PlusCircle
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Zap },
    { href: '/catalogo', label: 'Buscador y Precios', icon: Search },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { href: '/ingesta', label: 'Cargar Facturas / Listas', icon: UploadCloud },
    { href: '/proveedores', label: 'Proveedores', icon: Building2 },
    { href: '/configuracion', label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0F2137] text-white border-b border-slate-700/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Branding */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">Electro<span className="text-amber-400">Cotiza</span></span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">PY</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate max-w-[190px] sm:max-w-xs">
                Construlogica Emprendimientos S.A.
              </p>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Botón Acción Rápida (Desktop) */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/presupuestos/nuevo"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm shadow-md shadow-amber-500/20 hover:shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cotizar Obra</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

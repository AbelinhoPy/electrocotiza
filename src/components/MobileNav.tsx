'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, Camera, Briefcase, FileText } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  // No mostrar en login
  if (pathname === '/login') return null;

  const links = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/catalogo', label: 'Precios', icon: Search },
    { href: '/presupuestos/nuevo', label: 'Cotizar', icon: Plus, isAction: true },
    { href: '/ingesta', label: 'Facturas', icon: Camera },
    { href: '/empresa', label: 'Empresa', icon: Briefcase },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B1526]/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-5 h-16 items-center px-2 max-w-md mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

          if (link.isAction) {
            return (
              <div key={link.href} className="flex justify-center -mt-6">
                <Link
                  href={link.href}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-amber-500/40 active:scale-90 transition-transform border-4 border-[#070D18]"
                  title="Nueva Cotización"
                >
                  <Plus className="w-8 h-8 stroke-[3]" />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
                isActive ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

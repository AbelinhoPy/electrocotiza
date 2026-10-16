'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, FileText, Camera } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/catalogo', label: 'Precios', icon: Search },
    { href: '/presupuestos/nuevo', label: 'Cotizar', icon: Plus, isAction: true },
    { href: '/ingesta', label: 'Facturas', icon: Camera },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F2137] border-t border-slate-800 pb-safe shadow-2xl">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

          if (link.isAction) {
            return (
              <div key={link.href} className="flex justify-center -mt-5">
                <Link
                  href={link.href}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-amber-500/40 active:scale-95 transition-transform border-4 border-[#0F2137]"
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

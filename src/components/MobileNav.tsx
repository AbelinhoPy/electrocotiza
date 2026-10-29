'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, PlusCircle, Package, Users } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  // No mostrar en login
  if (pathname === '/login') return null;

  const links = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { href: '/presupuestos/nuevo', label: 'Nuevo', icon: PlusCircle, isPrimary: true },
    { href: '/catalogo', label: 'Precios', icon: Package },
    { href: '/clientes', label: 'Clientes', icon: Users },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0F172A] border-t border-slate-800 shadow-lg">
      <div className="grid grid-cols-5 h-14 items-center px-1 max-w-lg mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

          if (link.isPrimary) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center py-1 text-amber-400 font-bold"
              >
                <Icon className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] mt-0.5">{link.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

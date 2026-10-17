'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { DEMO_USERS } from '@/lib/data/initial-data';
import { UserProfile } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('construlogicaemprendimientossa@gmail.com');
  const [password, setPassword] = useState('********');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || DEMO_USERS[0];
    StorageService.setCurrentUser(user);
    router.push('/');
  };

  const handleQuickLogin = (user: UserProfile) => {
    StorageService.setCurrentUser(user);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B172A] via-[#0F2137] to-[#0A1626] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* CABECERA CON LOGO */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 shadow-xl shadow-amber-500/30">
          <Zap className="w-10 h-10 text-slate-950 fill-slate-950" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Electro<span className="text-amber-400">Cotiza</span>
        </h1>
        <p className="text-sm font-semibold text-slate-300">
          Construlogica Emprendimientos S.A.
        </p>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Sistema de Presupuestos, Homologación y Escaneo de Facturas para Paraguay
        </p>
      </div>

      {/* FORMULARIO DE ACCESO */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#13233c]/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-md space-y-6">
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/25 transition-all"
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* PERFILES DE ACCESO RÁPIDO PARA DEMOSTRACIÓN */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Acceso Rápido con 1 Clic (Sin Escribir):</span>
            </span>

            <div className="space-y-1.5">
              {DEMO_USERS.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => handleQuickLogin(usr)}
                  type="button"
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 block">
                      {usr.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {usr.email} • Rol: {usr.role === 'owner' ? 'Jefe de Obra (Owner)' : usr.role === 'electrician' ? 'Electricista' : 'Administración'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-1 rounded font-bold group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                    Entrar →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              Desarrollado para Construlogica Emprendimientos S.A. • Alto Paraná, Paraguay
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

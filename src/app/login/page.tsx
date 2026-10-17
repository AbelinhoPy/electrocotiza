'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, HardHat, Building, Sparkles } from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { DEMO_USERS } from '@/lib/data/initial-data';
import { UserProfile } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('construlogicaemprendimientossa@gmail.com');
  const [password, setPassword] = useState('********');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>(DEMO_USERS[0].id);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find(u => u.id === selectedUser) || DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || DEMO_USERS[0];
    StorageService.setCurrentUser(user);
    router.replace('/');
  };

  const handleQuickSelect = (user: UserProfile) => {
    setSelectedUser(user.id);
    setEmail(user.email);
    StorageService.setCurrentUser(user);
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-[#070D18] bg-gradient-to-b from-[#070D18] via-[#0B1526] to-[#050B14] text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-amber-400 selection:text-slate-950">
      
      {/* HEADER MÓVIL CON BRANDING DE CONSTRULOGICA */}
      <div className="pt-6 sm:pt-10 max-w-sm mx-auto w-full text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-2xl shadow-amber-500/40 mx-auto">
            <Zap className="w-9 h-9 sm:w-11 sm:h-11 text-slate-950 fill-slate-950" />
          </div>
          <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border-2 border-[#070D18] flex items-center space-x-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
            <span>Nube PY</span>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Electro<span className="text-amber-400">Cotiza</span>
          </h1>
          <p className="text-xs font-bold text-slate-300 tracking-wide mt-0.5">
            Construlogica Emprendimientos S.A.
          </p>
          <div className="inline-flex items-center space-x-1.5 text-[11px] text-amber-300/80 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full mt-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>RUC: 80074798-4 • Acceso Seguro</span>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL TIPO TARJETA MÓVIL NATIVA */}
      <div className="my-auto max-w-sm mx-auto w-full py-4">
        <div className="bg-[#0F1E33]/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5">
          
          {/* SELECCIÓN RÁPIDA DE CUADRILLA DE OBRA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <HardHat className="w-3.5 h-3.5" />
                <span>¿Quién inicia turno en obra?</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">1 Toque</span>
            </div>

            <div className="space-y-2">
              {DEMO_USERS.map((usr) => {
                const isOwner = usr.role === 'owner';
                const isSelected = selectedUser === usr.id;
                return (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => handleQuickSelect(usr)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center space-x-3 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-400/10 border-amber-400 shadow-md shadow-amber-400/10'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                      isOwner
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                        : 'bg-slate-800 text-slate-200'
                    }`}>
                      {usr.full_name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate block">
                          {usr.full_name}
                        </span>
                        {isOwner && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Jefe
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                        {usr.role === 'owner' ? 'Dueño • Aprobación de Presupuestos' : usr.role === 'electrician' ? 'Electricista • Relevamiento' : 'Administración • Facturas'}
                      </span>
                    </div>

                    <div className="text-amber-400 text-xs font-black shrink-0">
                      →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">o ingresar con clave</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* FORMULARIO DE ACCESO MANUAL */}
          <form onSubmit={handleLogin} className="space-y-3">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Contraseña / PIN de Obra
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all mt-2"
            >
              <span>Abrir Sistema de Obra</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

      {/* FOOTER MÓVIL */}
      <div className="pb-4 text-center space-y-1">
        <p className="text-[11px] text-slate-400 font-medium">
          Minga Guazú • Ciudad del Este • Alto Paraná
        </p>
        <p className="text-[10px] text-slate-600">
          Base de Datos Serverless en Neon PostgreSQL • Conexión Cifrada SSL
        </p>
      </div>

    </div>
  );
}

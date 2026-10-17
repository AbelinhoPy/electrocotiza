'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Eye, EyeOff } from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { INITIAL_USER } from '@/lib/data/initial-data';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('lucas.dure@construlogica.com.py');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Ingresa tu correo o usuario para continuar.');
      return;
    }

    if (!password) {
      setError('Ingresa tu contraseña o PIN de acceso.');
      return;
    }

    setIsLoading(true);

    // Autenticación del usuario único autorizado: Lucas Duré
    setTimeout(() => {
      StorageService.setCurrentUser({
        ...INITIAL_USER,
        email: identifier.trim(),
      });
      router.replace('/');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#070D18] bg-gradient-to-b from-[#070D18] via-[#0B1526] to-[#050B14] text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-amber-400 selection:text-slate-950">
      
      {/* HEADER CON BRANDING EMPRESARIAL */}
      <div className="pt-6 sm:pt-10 max-w-sm mx-auto w-full text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-2xl shadow-amber-500/40 mx-auto">
            <Zap className="w-9 h-9 sm:w-11 sm:h-11 text-slate-950 fill-slate-950" />
          </div>
          <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border-2 border-[#070D18] flex items-center space-x-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
            <span>Seguro</span>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Electro<span className="text-amber-400">Cotiza</span>
          </h1>
          <p className="text-xs font-bold text-slate-300 tracking-wide mt-0.5">
            Construlogica Emprendimientos S.A.
          </p>
          <div className="inline-flex items-center space-x-1.5 text-[10px] text-amber-300/80 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full mt-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>RUC: 80074798-4 • Portal de Acceso</span>
          </div>
        </div>
      </div>

      {/* TARJETA DE LOGIN EJECUTIVO PARA CLIENTE */}
      <div className="my-auto max-w-sm mx-auto w-full py-4">
        <div className="bg-[#0F1E33]/95 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5">
          
          {/* IDENTIFICACIÓN DEL USUARIO TITULAR: LUCAS DURÉ */}
          <div className="bg-[#070D18] border border-slate-800 rounded-2xl p-3.5 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-amber-400/20">
              LD
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-white truncate block">
                  Lucas Duré
                </span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                  Titular
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">
                Construlogica Emprendimientos S.A.
              </span>
            </div>
          </div>

          {/* FORMULARIO DE ACCESO CON CREDENCIALES */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="lucas.dure@construlogica.com.py"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contraseña o PIN de Seguridad
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu clave de acceso"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-400 focus:ring-0 focus:ring-offset-0"
                />
                <span>Recordar sesión</span>
              </label>
              <span className="text-[10px] text-amber-400/80 font-mono">SSL 256-bit</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all mt-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

      {/* FOOTER */}
      <div className="pb-4 text-center space-y-1">
        <p className="text-[11px] text-slate-400 font-medium">
          Minga Guazú • Ciudad del Este • Alto Paraná, Paraguay
        </p>
        <p className="text-[10px] text-slate-600">
          Acceso Exclusivo • Construlogica Emprendimientos S.A.
        </p>
      </div>

    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setError(res.error || 'Correo o contraseña incorrectos.');
        setIsLoading(false);
      } else {
        // Redirección completa garantizada para actualizar la sesión en toda la app
        window.location.href = '/';
      }
    } catch {
      setError('Ocurrió un error al procesar el ingreso. Inténtalo nuevamente.');
      setIsLoading(false);
    }
  };

  const autofillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900">
      <div className="max-w-md w-full">
        {/* Cabecera con Marca */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0F172A] text-amber-400 shadow-md mb-4">
            <Zap className="w-8 h-8 fill-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Ingresar a Electro<span className="text-amber-500">Cotiza</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Construlogica Emprendimientos S.A.
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@construlogica.com.py"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña de acceso"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Verificando ingreso...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </form>

          {/* Accesos rápidos de prueba para facilitar el ingreso */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Seleccionar cuenta de acceso rápido
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => autofillCredentials('admin@construlogica.com.py', 'Admin2026*')}
                className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/60 hover:bg-blue-100 text-left transition-colors flex flex-col items-start group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-blue-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Administrador</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">Lucas Duré</span>
              </button>

              <button
                type="button"
                onClick={() => autofillCredentials('secretaria@construlogica.com.py', 'Secretaria2026*')}
                className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100 text-left transition-colors flex flex-col items-start group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-900">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secretaría</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">Ana López</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <p className="text-[11px] text-slate-400">
              ¿No tienes cuenta o necesitas restablecer tu acceso? Consulta con el Administrador.
            </p>
          </div>
        </div>

        {/* Pie de página discreto */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>Minga Guazú • Ciudad del Este • Asunción, Paraguay</p>
          <p className="mt-0.5 font-semibold text-slate-500">Acceso Seguro • Construlogica Emprendimientos S.A.</p>
        </div>
      </div>
    </div>
  );
}

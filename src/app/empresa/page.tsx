'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Eye, 
  FileText,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Settings } from '@/lib/types';

export default function MiEmpresaPage() {
  const [settings, setSettings] = useState<Settings>(StorageService.getSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* ENCABEZADO MÓVIL */}
      <div>
        <div className="inline-flex items-center space-x-1.5 bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/20 mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Perfil Emisor del Presupuesto</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Datos de Mi Empresa
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Membrete oficial y cuentas bancarias SIPAP para transferencias de clientes
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Datos guardados correctamente. Los nuevos presupuestos saldrán con este membrete.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        
        {/* TARJETA 1: IDENTIFICACIÓN LEGAL Y MARCA */}
        <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Membrete y RUC</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-semibold">Para PDF Cliente</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Razón Social Oficial:</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Construlogica Emprendimientos S.A."
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Nombre Fantasía:</label>
              <input
                type="text"
                value={settings.fantasy_name || ''}
                onChange={(e) => setSettings({ ...settings, fantasy_name: e.target.value })}
                placeholder="Construlogica Obras Eléctricas"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">RUC Emisor:</label>
              <input
                type="text"
                required
                value={settings.ruc}
                onChange={(e) => setSettings({ ...settings, ruc: e.target.value })}
                placeholder="80074798-4"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Teléfono / WhatsApp de Obra:</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+595 983 530890"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Correo Electrónico:</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="construlogicaemprendimientossa@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Ciudad:</label>
                <input
                  type="text"
                  value={settings.city || 'Minga Guazú'}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Departamento:</label>
                <input
                  type="text"
                  value={settings.department || 'Alto Paraná'}
                  onChange={(e) => setSettings({ ...settings, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Dirección de Obra / Depósito:</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Km 16 Avda. Juana María de Lara 0 - Minga Guazú"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* TARJETA 2: DATOS BANCARIOS PARA TRANSFERENCIAS (SIPAP) */}
        <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>Cuenta Bancaria SIPAP (Para Cobros)</span>
            </h2>
            <span className="text-[11px] text-emerald-400 font-bold">Transferencias PY</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Banco:</label>
              <input
                type="text"
                value={settings.bank_name || ''}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                placeholder="Banco Itaú Paraguay"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Titular de la Cuenta:</label>
              <input
                type="text"
                value={settings.bank_account_holder || ''}
                onChange={(e) => setSettings({ ...settings, bank_account_holder: e.target.value })}
                placeholder="Construlogica Emprendimientos S.A."
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Número de Cuenta (₲):</label>
              <input
                type="text"
                value={settings.bank_account_number || ''}
                onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                placeholder="720014589"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Alias SIPAP:</label>
              <input
                type="text"
                value={settings.bank_sipap_alias || ''}
                onChange={(e) => setSettings({ ...settings, bank_sipap_alias: e.target.value })}
                placeholder="construlogica.py"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* PREVISUALIZACIÓN DEL MEMBRETE */}
        <div className="bg-[#0A1626] border border-amber-400/30 p-4 sm:p-5 rounded-3xl space-y-3">
          <span className="text-[11px] uppercase font-black text-amber-400 tracking-wider flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa del Membrete Oficial:</span>
          </span>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
            <div className="text-base font-black text-amber-400">
              {settings.company_name}
            </div>
            <p className="text-slate-300">
              RUC: {settings.ruc} • Tel: {settings.phone}
            </p>
            <p className="text-slate-400">
              {settings.address} - {settings.city}, {settings.department}
            </p>
            {settings.bank_account_number && (
              <p className="text-[11px] text-emerald-400 font-mono pt-1">
                SIPAP: {settings.bank_name} • Cta: {settings.bank_account_number} • Alias: {settings.bank_sipap_alias}
              </p>
            )}
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Datos de la Empresa</span>
          </button>
        </div>

      </form>

    </div>
  );
}

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="border-b border-slate-200 pb-4">
        <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Perfil Emisor del Presupuesto</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Datos de Mi Empresa (Membrete y Cuentas)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Configura los datos fiscales, de contacto y cuentas bancarias de Construlogica para que aparezcan en los presupuestos en PDF emitidos a tus clientes.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Datos de la empresa actualizados correctamente. Todos los nuevos presupuestos saldrán con esta información.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* TARJETA 1: IDENTIFICACIÓN LEGAL Y MARCA */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Identificación Legal y Comercial</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Requerido para el PDF</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social Oficial:</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Construlogica Emprendimientos S.A."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Comercial / Fantasía:</label>
              <input
                type="text"
                value={settings.fantasy_name || ''}
                onChange={(e) => setSettings({ ...settings, fantasy_name: e.target.value })}
                placeholder="Construlogica Obras Eléctricas"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RUC Emisor:</label>
              <input
                type="text"
                required
                value={settings.ruc}
                onChange={(e) => setSettings({ ...settings, ruc: e.target.value })}
                placeholder="80074798-4"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono / WhatsApp de Obra:</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+595 983 530890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico:</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="construlogicaemprendimientossa@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ciudad:</label>
                <input
                  type="text"
                  value={settings.city || 'Minga Guazú'}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Departamento:</label>
                <input
                  type="text"
                  value={settings.department || 'Alto Paraná'}
                  onChange={(e) => setSettings({ ...settings, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección de Oficina / Depósito de Materiales:</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Km 16 Avda. Juana María de Lara 0 - Minga Guazú / Km 12 Acaray"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* TARJETA 2: DATOS BANCARIOS PARA TRANSFERENCIAS (SIPAP) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Datos Bancarios para Pago de Clientes (SIPAP)</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Se incluye en pie del presupuesto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Entidad Bancaria:</label>
              <input
                type="text"
                value={settings.bank_name || ''}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                placeholder="Ej: Banco Continental S.A.E.C.A."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Titular de la Cuenta:</label>
              <input
                type="text"
                value={settings.bank_account_holder || ''}
                onChange={(e) => setSettings({ ...settings, bank_account_holder: e.target.value })}
                placeholder="Construlogica Emprendimientos S.A."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número de Cuenta (Guaraníes):</label>
              <input
                type="text"
                value={settings.bank_account_number || ''}
                onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                placeholder="01-248900-05"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alias SIPAP / RUC:</label>
              <input
                type="text"
                value={settings.bank_sipap_alias || ''}
                onChange={(e) => setSettings({ ...settings, bank_sipap_alias: e.target.value })}
                placeholder="80074798-4"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* PREVISUALIZACIÓN EN VIVO DEL MEMBRETE */}
        <div className="bg-[#0F2137] text-white p-5 rounded-3xl border border-slate-800 space-y-3">
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa del Membrete en tus Presupuestos:</span>
          </span>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-lg font-black text-amber-400">
                {settings.company_name || 'Nombre de la Empresa'}
              </div>
              <p className="text-xs text-slate-300">
                RUC: {settings.ruc} | Tel: {settings.phone}
              </p>
              <p className="text-xs text-slate-400">
                {settings.address} - {settings.city}, {settings.department}
              </p>
              {settings.bank_account_number && (
                <p className="text-[11px] text-emerald-400 font-mono pt-1">
                  Transferencias: {settings.bank_name} Cta: {settings.bank_account_number} (Alias: {settings.bank_sipap_alias})
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-widest block">
                PRESUPUESTO EJECUTIVO
              </span>
              <span className="text-xs text-slate-400 block font-mono">
                COT-2026-XXX
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-400/30">
                Marco Dorado Activo
              </span>
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-8 py-3 rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Datos de la Empresa</span>
          </button>
        </div>

      </form>

    </div>
  );
}

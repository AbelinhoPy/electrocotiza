'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Settings } from '@/lib/types';

export default function ConfiguracionPage() {
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

  const handleResetData = () => {
    if (confirm('¿Restablecer datos de prueba iniciales (incluyendo las facturas de Enerluz y Fixopar)?')) {
      StorageService.resetToInitialData();
      setSettings(StorageService.getSettings());
      alert('Datos restablecidos correctamente.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Configuración General
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Ajusta los datos de tu empresa, los parámetros de presupuestos en PDF y los umbrales de precios.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Configuración guardada correctamente.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* IDENTIDAD DE EMPRESA */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Datos de la Empresa (Membrete de Presupuestos)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre o Razón Social:</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RUC:</label>
              <input
                type="text"
                required
                value={settings.ruc}
                onChange={(e) => setSettings({ ...settings, ruc: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono de Contacto:</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico:</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección Legal / Depósito:</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* PARÁMETROS DEL PDF Y VALIDEZ */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Formato del Presupuesto PDF para el Cliente</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-900 block">Marco Exterior Dorado (#D4AF37)</span>
                <p className="text-xs text-slate-500">
                  Añade un marco institucional de distinción ejecutiva alrededor de toda la página del PDF.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.pdf_gold_border}
                onChange={(e) => setSettings({ ...settings, pdf_gold_border: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Días de Validez por Defecto:</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.pdf_validez_dias}
                  onChange={(e) => setSettings({ ...settings, pdf_validez_dias: parseInt(e.target.value) || 15 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Margen de Ganancia Defecto (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.default_margin_pct}
                  onChange={(e) => setSettings({ ...settings, default_margin_pct: parseFloat(e.target.value) || 30 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Forma de Pago Defecto:</label>
                <input
                  type="text"
                  value={settings.pdf_condicion_pago_defecto}
                  onChange={(e) => setSettings({ ...settings, pdf_condicion_pago_defecto: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plazo de Entrega Defecto:</label>
                <input
                  type="text"
                  value={settings.pdf_plazo_entrega_defecto}
                  onChange={(e) => setSettings({ ...settings, pdf_plazo_entrega_defecto: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pie de Página Confidencial:</label>
                <input
                  type="text"
                  value={settings.pdf_pie_texto}
                  onChange={(e) => setSettings({ ...settings, pdf_pie_texto: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PARÁMETROS DE MERCADO: UMBRAL DE PRECIOS VIEJOS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Reglas de Mercado y Alertas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alerta de Precio Antiguo (Días):
              </label>
              <input
                type="number"
                min="15"
                max="365"
                value={settings.price_stale_days}
                onChange={(e) => setSettings({ ...settings, price_stale_days: parseInt(e.target.value) || 60 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Si una cotización supera estos días (por defecto 60), se muestra una alerta visual amarilla para evitar pérdidas por inflación.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tasa de IVA (%):</label>
              <input
                type="number"
                disabled
                value={10}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm font-semibold text-slate-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                IVA General 10% de Paraguay (DNIT). Los precios al cliente siempre lo incluyen.
              </p>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Prueba</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-sm shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>

      </form>

    </div>
  );
}

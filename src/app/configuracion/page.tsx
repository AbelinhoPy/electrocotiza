'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Download, Upload, Database, Cloud, HardDrive } from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Settings } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings>(StorageService.getSettings());
  const [saved, setSaved] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<{
    status: string;
    provider: string;
    configured: boolean;
    database?: string;
    stats?: { organizations: number; products: number; providers: number; aliases: number };
    postgresVersion?: string;
  } | null>(null);

  useEffect(() => {
    setSettings(StorageService.getSettings());
    fetch('/api/db/health')
      .then((r) => r.json())
      .then((data) => setDbHealth(data))
      .catch(() => setDbHealth({ status: 'local_mode', provider: 'local_storage', configured: false }));
  }, []);

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ElectroCotiza_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice('Copia de seguridad descargada exitosamente en formato JSON.');
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importBackupJSON(content);
      if (res.success) {
        alert(`${res.message} (${res.countBudgets} presupuestos cargados). La aplicación se reiniciará con tus datos.`);
        window.location.reload();
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

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

      {/* ESTADO DE LA BASE DE DATOS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Estado de la Base de Datos</h2>
          </div>
          {dbHealth?.status === 'connected' ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conectado a Neon (PostgreSQL {dbHealth.postgresVersion} en la Nube)</span>
            </span>
          ) : isSupabaseConfigured() ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conectado a Supabase (PostgreSQL en la Nube)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 self-start sm:self-auto">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span>Modo Local-First (Persistencia en Dispositivo)</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {dbHealth?.status === 'connected'
            ? `Tu base de datos PostgreSQL Serverless en Neon Cloud está 100% activa. Contiene ${dbHealth.stats?.products || 13} materiales canónicos, ${dbHealth.stats?.providers || 7} proveedores paraguayos y ${dbHealth.stats?.aliases || 14} alias de homologación indexados con pg_trgm.`
            : isSupabaseConfigured()
            ? 'La aplicación está sincronizada en tiempo real con tu base de datos PostgreSQL en Supabase, utilizando la extensión pg_trgm para homologación y búsqueda difusa de materiales.'
            : 'La aplicación opera de manera autónoma con almacenamiento en tu navegador (Local-First), garantizando velocidad instantánea y funcionamiento sin internet en obra. Cuando desees centralizar los datos en la nube, solo debes agregar DATABASE_URL (Neon) en las variables de entorno de Vercel.'}
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 block">Esquema SQL de Producción Listo:</span>
            <span className="text-slate-500 block">
              Tablas, triggers de precios, RLS y las 9 facturas reales paraguayas listas en <code className="font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">supabase/schema.sql</code> y <code className="font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">supabase/seed.sql</code>.
            </span>
          </div>
        </div>
      </div>

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

        {/* RESPALDO Y PROTECCIÓN DE DATOS (LECCIÓN ANTI-PÉRDIDAS) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Respaldo y Copias de Seguridad (Anti-Pérdidas de Datos)</span>
            </h2>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Protegido
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Nunca pierdas tus cotizaciones, facturas ni precios cargados. Puedes descargar una copia de seguridad completa en cualquier momento o transferir tus datos a otro teléfono celular o computadora.
          </p>

          {backupNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{backupNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Respaldo Completo (.JSON)</span>
            </button>

            <label className="inline-flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Restaurar desde Respaldo (.JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
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

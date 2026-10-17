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
    <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* ENCABEZADO MÓVIL */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          <span>Configuración del Sistema</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Parámetros de empresa, márgenes, base de datos y respaldos
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Configuración guardada correctamente.</span>
        </div>
      )}

      {/* ESTADO DE LA BASE DE DATOS */}
      <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black text-white">Estado de la Base de Datos</h2>
          </div>
          {dbHealth?.status === 'connected' ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conectado a Neon (PostgreSQL {dbHealth.postgresVersion} Cloud)</span>
            </span>
          ) : isSupabaseConfigured() ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conectado a Supabase</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 self-start sm:self-auto">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>Modo Local-First (Persistencia Local)</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {dbHealth?.status === 'connected'
            ? `Tu base de datos PostgreSQL Serverless en Neon Cloud está 100% activa. Contiene ${dbHealth.stats?.products || 13} materiales canónicos, ${dbHealth.stats?.providers || 7} proveedores paraguayos y ${dbHealth.stats?.aliases || 14} alias de homologación indexados con pg_trgm.`
            : isSupabaseConfigured()
            ? 'La aplicación está sincronizada en tiempo real con tu base de datos PostgreSQL en Supabase.'
            : 'La aplicación opera de manera autónoma con almacenamiento en tu dispositivo (Local-First), garantizando velocidad instantánea y funcionamiento sin internet en obra.'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        
        {/* PARÁMETROS DEL PDF Y VALIDEZ */}
        <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-black text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Formato del Presupuesto PDF</span>
          </h2>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Marco Exterior Dorado (#D4AF37)</span>
                <p className="text-[11px] text-slate-400">
                  Añade un marco institucional ejecutivo alrededor de la página.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.pdf_gold_border}
                onChange={(e) => setSettings({ ...settings, pdf_gold_border: e.target.checked })}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Días de Validez Defecto:</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.pdf_validez_dias}
                  onChange={(e) => setSettings({ ...settings, pdf_validez_dias: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Margen Defecto (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.default_margin_pct}
                  onChange={(e) => setSettings({ ...settings, default_margin_pct: parseFloat(e.target.value) || 30 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Forma de Pago Defecto:</label>
                <input
                  type="text"
                  value={settings.pdf_condicion_pago_defecto}
                  onChange={(e) => setSettings({ ...settings, pdf_condicion_pago_defecto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Plazo de Entrega Defecto:</label>
                <input
                  type="text"
                  value={settings.pdf_plazo_entrega_defecto}
                  onChange={(e) => setSettings({ ...settings, pdf_plazo_entrega_defecto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESPALDO Y PROTECCIÓN DE DATOS (LECCIÓN ANTI-PÉRDIDAS) */}
        <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-black text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Respaldo y Copias de Seguridad</span>
            </h2>
            <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
              Anti-Pérdidas
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Descarga una copia completa en JSON para transferir tus datos a otro teléfono o computadora.
          </p>

          {backupNotice && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{backupNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Respaldo (.JSON)</span>
            </button>

            <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95">
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Restaurar (.JSON)</span>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Datos Iniciales</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>

      </form>

    </div>
  );
}

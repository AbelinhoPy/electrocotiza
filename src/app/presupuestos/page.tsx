'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  PlusCircle, 
  Download, 
  Copy, 
  Trash2, 
  FileSpreadsheet, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';
import { generateInternalExcel } from '@/lib/export/excel-generator';

export default function PresupuestosPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadBudgets = () => {
    setBudgets(StorageService.getBudgets());
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleDownloadPDF = async (budget: Budget) => {
    try {
      setDownloadingId(budget.id);
      const settings = StorageService.getSettings();
      const doc = await generateClientPDF(budget, settings);
      doc.save(`Presupuesto_${budget.budget_number}_${budget.client.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generando PDF', err);
      alert('Error al generar el PDF del presupuesto.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadExcel = (budget: Budget) => {
    generateInternalExcel(budget);
  };

  const handleDuplicate = (id: string) => {
    const copy = StorageService.duplicateBudget(id);
    if (copy) {
      loadBudgets();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) {
      StorageService.deleteBudget(id);
      loadBudgets();
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Presupuestos y Cotizaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona, duplica y descarga los presupuestos ejecutivos en PDF para tus clientes o en Excel para auditoría.
          </p>
        </div>

        <Link
          href="/presupuestos/nuevo"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Presupuesto</span>
        </Link>
      </div>

      {/* FILTROS DE ESTADO */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'draft', label: 'Borradores' },
          { key: 'sent', label: 'Enviados' },
          { key: 'accepted', label: 'Aceptados' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LISTADO DE PRESUPUESTOS */}
      <div className="space-y-3">
        {filteredBudgets.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            {/* Info Principal */}
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center space-x-2.5">
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                  {b.budget_number}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  b.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {b.status === 'accepted' ? 'Aceptado' : 'Borrador'}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDatePY(b.created_at.split('T')[0])}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {b.title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cliente: <strong className="text-slate-700">{b.client.name}</strong></span>
                </span>
                <span>•</span>
                <span>{b.items.length} ítems cargados</span>
                <span>•</span>
                <span>Margen global: <strong>{b.global_margin_pct}%</strong></span>
              </div>
            </div>

            {/* Monto y Botones de Acción */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total al Cliente (IVA 10% inc.)
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatPYG(b.total_sale_pyg)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadExcel(b)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Descargar Excel Interno (con costos y proveedores)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  onClick={() => handleDownloadPDF(b)}
                  disabled={downloadingId === b.id}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-[#0F2137] hover:bg-[#1a375a] text-amber-400 border border-amber-400/30 text-xs font-bold shadow-sm transition-all"
                  title="Descargar PDF para Cliente (Marco Dorado, sin costos)"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF Cliente</span>
                </button>

                <button
                  onClick={() => handleDuplicate(b.id)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Duplicar este presupuesto"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  title="Eliminar presupuesto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredBudgets.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No hay presupuestos registrados</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Arma tu primer presupuesto en minutos desde el celular o la computadora.
            </p>
            <Link
              href="/presupuestos/nuevo"
              className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Nuevo Presupuesto</span>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

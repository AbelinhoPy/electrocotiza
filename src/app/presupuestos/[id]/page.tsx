'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  Trash2, 
  Plus, 
  Save, 
  User, 
  Calendar, 
  Building2, 
  Calculator,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, BudgetItem, Settings } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';
import { generateInternalExcel } from '@/lib/export/excel-generator';

export default function DetallePresupuestoPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params?.id as string;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [settings, setSettings] = useState<Settings>(StorageService.getSettings());
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setSettings(StorageService.getSettings());
    if (budgetId) {
      const b = StorageService.getBudgetById(budgetId);
      if (b) {
        setBudget(b);
      }
    }
  }, [budgetId]);

  if (!budget) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Presupuesto no encontrado</h2>
        <Link
          href="/presupuestos"
          className="inline-flex items-center space-x-2 text-sm text-amber-600 font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de presupuestos</span>
        </Link>
      </div>
    );
  }

  // Recalcular totales al cambiar cantidades o márgenes
  const handleQuantityChange = (index: number, newQty: number) => {
    const updated = { ...budget };
    const item = updated.items[index];
    const qty = Math.max(0.1, newQty);
    item.quantity = qty;
    item.total_sale_pyg = Math.round(item.unit_sale_pyg * qty);

    updated.total_cost_pyg = updated.items.reduce((sum, it) => sum + (it.unit_cost_pyg * it.quantity), 0);
    updated.total_sale_pyg = updated.items.reduce((sum, it) => sum + it.total_sale_pyg, 0);
    updated.iva_amount_pyg = Math.round(updated.total_sale_pyg / 11);
    setBudget(updated);
  };

  const handleMarginChange = (index: number, newMargin: number) => {
    const updated = { ...budget };
    const item = updated.items[index];
    item.margin_pct = newMargin;
    item.unit_sale_pyg = Math.round(item.unit_cost_pyg * (1 + newMargin / 100));
    item.total_sale_pyg = Math.round(item.unit_sale_pyg * item.quantity);

    updated.total_cost_pyg = updated.items.reduce((sum, it) => sum + (it.unit_cost_pyg * it.quantity), 0);
    updated.total_sale_pyg = updated.items.reduce((sum, it) => sum + it.total_sale_pyg, 0);
    updated.iva_amount_pyg = Math.round(updated.total_sale_pyg / 11);
    setBudget(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = { ...budget };
    updated.items = updated.items.filter((_, i) => i !== index);
    updated.total_cost_pyg = updated.items.reduce((sum, it) => sum + (it.unit_cost_pyg * it.quantity), 0);
    updated.total_sale_pyg = updated.items.reduce((sum, it) => sum + it.total_sale_pyg, 0);
    updated.iva_amount_pyg = Math.round(updated.total_sale_pyg / 11);
    setBudget(updated);
  };

  const handleSave = () => {
    StorageService.saveBudget(budget);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const doc = await generateClientPDF(budget, settings);
      doc.save(`Presupuesto_${budget.budget_number}_${budget.client.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error generando PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcel = () => {
    generateInternalExcel(budget);
  };

  const handleDuplicate = () => {
    const copy = StorageService.duplicateBudget(budget.id);
    if (copy) {
      router.push(`/presupuestos/${copy.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/presupuestos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                {budget.budget_number}
              </span>
              <span className="text-xs text-slate-500">
                {formatDatePY(budget.created_at.split('T')[0])}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {budget.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadExcel}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            title="Descargar Excel Interno (con costos y proveedores)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={handleDuplicate}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            title="Duplicar este presupuesto"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2137] hover:bg-[#1a375a] text-amber-400 border border-amber-400/30 shadow-md transition-all"
            title="Descargar PDF para el cliente con marco dorado"
          >
            <Download className="w-4 h-4" />
            <span>PDF Cliente (Marco Dorado)</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {isSavedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Cambios guardados con éxito.</span>
        </div>
      )}

      {/* DETALLES DEL CLIENTE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Cliente ("PARA:")</span>
          <strong className="text-sm text-slate-900">{budget.client.name}</strong>
          <span className="text-slate-500 block">RUC / C.I.: {budget.client.ruc_or_ci}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Ubicación y Contacto</span>
          <span className="text-slate-700 block">{budget.client.address}</span>
          <span className="text-slate-500 block">Tel: {budget.client.phone}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Condiciones</span>
          <span className="text-slate-700 block">Validez: {budget.validity_days} días</span>
          <span className="text-slate-500 block">Entrega: {budget.delivery_terms}</span>
        </div>
      </div>

      {/* TABLA DE ÍTEMS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Líneas del Presupuesto ({budget.items.length} ítems)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Precios con IVA 10% incluido
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {budget.items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    item.item_type === 'material' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.item_type === 'material' ? 'Material' : 'Mano de Obra'}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{item.description}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>Costo: <strong>{formatPYG(item.unit_cost_pyg)}</strong></span>
                  <span>Margen: <strong>{item.margin_pct}%</strong></span>
                  <span>Unidad: <strong>{item.unit}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Cant.</span>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Margen %</span>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={item.margin_pct}
                    onChange={(e) => handleMarginChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-14 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="text-right min-w-[90px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Venta</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatPYG(item.total_sale_pyg)}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  title="Eliminar ítem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOTALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider block">Auditoría Interna</span>
          <div className="flex justify-between">
            <span>Costo Total de Compra:</span>
            <strong>{formatPYG(budget.total_cost_pyg)}</strong>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold pt-2 border-t border-slate-100">
            <span>Ganancia Bruta Estimada:</span>
            <span>{formatPYG(budget.total_sale_pyg - budget.total_cost_pyg)}</span>
          </div>
        </div>

        <div className="bg-[#0F2137] text-white p-5 rounded-2xl space-y-2 text-right">
          <span className="text-xs text-amber-400 uppercase font-bold tracking-wider block">
            Total General al Cliente (IVA 10% inc.)
          </span>
          <div className="text-3xl font-black text-amber-400">
            {formatPYG(budget.total_sale_pyg)}
          </div>
        </div>
      </div>

    </div>
  );
}

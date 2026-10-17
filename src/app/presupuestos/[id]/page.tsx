'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Copy, 
  Save, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle2, 
  Landmark, 
  Check, 
  Plus, 
  Building2,
  Eye,
  FileText
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, BudgetItem } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';
import { generateInternalExcel } from '@/lib/export/excel-generator';

export default function PresupuestoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const settings = StorageService.getSettings();

  useEffect(() => {
    if (id) {
      const b = StorageService.getBudgetById(id);
      if (b) {
        setBudget(b);
      } else {
        router.push('/presupuestos');
      }
    }
  }, [id, router]);

  if (!budget) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400">
        Cargando presupuesto...
      </div>
    );
  }

  const handleQuantityChange = (index: number, newQty: number) => {
    const updatedItems = [...budget.items];
    const it = updatedItems[index];
    const qty = Math.max(0, newQty);
    const saleUnit = Math.round(it.unit_cost_pyg * (1 + it.margin_pct / 100));
    it.quantity = qty;
    it.unit_sale_pyg = saleUnit;
    it.total_sale_pyg = Math.round(saleUnit * qty);

    const totalCost = updatedItems.reduce((acc, curr) => acc + (curr.unit_cost_pyg * curr.quantity), 0);
    const totalSale = updatedItems.reduce((acc, curr) => acc + curr.total_sale_pyg, 0);

    setBudget({
      ...budget,
      items: updatedItems,
      total_cost_pyg: totalCost,
      total_sale_pyg: totalSale,
      updated_at: new Date().toISOString(),
    });
  };

  const handleMarginChange = (index: number, newMargin: number) => {
    const updatedItems = [...budget.items];
    const it = updatedItems[index];
    const margin = Math.max(0, newMargin);
    const saleUnit = Math.round(it.unit_cost_pyg * (1 + margin / 100));
    it.margin_pct = margin;
    it.unit_sale_pyg = saleUnit;
    it.total_sale_pyg = Math.round(saleUnit * it.quantity);

    const totalCost = updatedItems.reduce((acc, curr) => acc + (curr.unit_cost_pyg * curr.quantity), 0);
    const totalSale = updatedItems.reduce((acc, curr) => acc + curr.total_sale_pyg, 0);

    setBudget({
      ...budget,
      items: updatedItems,
      total_cost_pyg: totalCost,
      total_sale_pyg: totalSale,
      updated_at: new Date().toISOString(),
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = budget.items.filter((_, i) => i !== index);
    const totalCost = updatedItems.reduce((acc, curr) => acc + (curr.unit_cost_pyg * curr.quantity), 0);
    const totalSale = updatedItems.reduce((acc, curr) => acc + curr.total_sale_pyg, 0);

    setBudget({
      ...budget,
      items: updatedItems,
      total_cost_pyg: totalCost,
      total_sale_pyg: totalSale,
      updated_at: new Date().toISOString(),
    });
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
      console.error('Error generando PDF', err);
      alert('Error al generar PDF del presupuesto.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcel = () => {
    generateInternalExcel(budget);
  };

  const handleShareWhatsApp = () => {
    const phone = budget.client.phone ? budget.client.phone.replace(/[^0-9]/g, '') : '';
    const text = `*PRESUPUESTO ELÉCTRICO ${budget.budget_number}* ⚡\n` +
      `*De:* Construlogica Emprendimientos S.A.\n` +
      `*Cliente:* ${budget.client.name}\n` +
      `*Obra / Trabajo:* ${budget.title}\n\n` +
      `💰 *Total Presupuesto:* ${formatPYG(budget.total_sale_pyg)} (IVA 10% incluido)\n` +
      `⏱️ *Validez:* ${budget.validity_days} días\n` +
      `📦 *Entrega:* ${budget.delivery_terms}\n` +
      `💳 *Pago:* ${budget.payment_terms}\n\n` +
      `_Presupuesto oficial emitido por ElectroCotiza._`;

    const encoded = encodeURIComponent(text);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopyBank = () => {
    const text = `*DATOS PARA TRANSFERENCIA BANCARIA (SIPAP)*\n` +
      `Banco: ${settings.bank_name || 'Banco Itaú Paraguay'}\n` +
      `Titular: ${settings.bank_account_holder || settings.company_name}\n` +
      `Cta Cte (₲): ${settings.bank_account_number || '720014589'}\n` +
      `RUC: ${settings.ruc}\n` +
      `Alias SIPAP: ${settings.bank_sipap_alias || 'construlogica.py'}\n` +
      `Ref: Presupuesto ${budget.budget_number}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 3000);
  };

  return (
    <div className="max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <Link
            href="/presupuestos"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                {budget.budget_number}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatDatePY(budget.created_at.split('T')[0])}
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-white tracking-tight mt-0.5">
              {budget.title}
            </h1>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            title="Enviar por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20 active:scale-95 transition-all"
            title="Descargar PDF Dorado para Cliente"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Generando...' : 'PDF'}</span>
          </button>

          <button
            onClick={handleSave}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 active:scale-95 transition-all"
            title="Guardar Cambios"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isSavedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Cambios guardados con éxito.</span>
        </div>
      )}

      {/* DETALLES DEL CLIENTE */}
      <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Cliente ("PARA:")</span>
          <strong className="text-sm font-black text-white">{budget.client.name}</strong>
          <span className="text-slate-400 block mt-0.5">RUC / C.I.: {budget.client.ruc_or_ci}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Ubicación y Contacto</span>
          <span className="text-slate-200 block">{budget.client.address}</span>
          <span className="text-slate-400 block">Tel: {budget.client.phone}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Condiciones</span>
          <span className="text-slate-200 block">Validez: {budget.validity_days} días</span>
          <span className="text-slate-400 block">Entrega: {budget.delivery_terms}</span>
        </div>
      </div>

      {/* CUENTA BANCARIA PARA TRANSFERENCIA SIPAP */}
      <div className="bg-[#0A1626] rounded-3xl border border-amber-400/30 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2.5">
          <div className="p-2 bg-amber-400/10 rounded-xl text-amber-400 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-400 block">Cobro por SIPAP / Bancario:</span>
            <span className="text-slate-300 font-mono text-[11px] block">
              {settings.bank_name || 'Banco Itaú'} • Cta: {settings.bank_account_number || '720014589'} • Alias: {settings.bank_sipap_alias || 'construlogica.py'}
            </span>
          </div>
        </div>
        <button
          onClick={handleCopyBank}
          className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-amber-400 text-slate-950 rounded-xl text-xs font-black active:scale-95 transition-all shrink-0"
        >
          {copiedBank ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedBank ? '¡Copiado!' : 'Copiar SIPAP'}</span>
        </button>
      </div>

      {/* LISTA DE ÍTEMS EN TARJETAS MÓVILES */}
      <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-white">
            Líneas del Presupuesto ({budget.items.length} ítems)
          </h3>
          <span className="text-[11px] text-amber-400 font-bold">
            IVA 10% incluido
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {budget.items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-500 font-bold text-[10px]">#{idx + 1}</span>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    item.item_type === 'material' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {item.item_type === 'material' ? 'Material' : 'Mano de Obra'}
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm truncate">{item.description}</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                  <span>Costo: <strong className="text-slate-300">{formatPYG(item.unit_cost_pyg)}</strong></span>
                  <span>Unidad: <strong className="text-slate-300">{item.unit}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Cant.</span>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white font-mono"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Margen %</span>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={item.margin_pct}
                    onChange={(e) => handleMarginChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white font-mono"
                  />
                </div>

                <div className="text-right min-w-[85px]">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Venta</span>
                  <span className="text-xs sm:text-sm font-black text-amber-400">
                    {formatPYG(item.total_sale_pyg)}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#0F1E33] p-4 rounded-3xl border border-slate-800 space-y-1.5 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Auditoría Interna</span>
          <div className="flex justify-between text-slate-300">
            <span>Costo Total Compra:</span>
            <strong>{formatPYG(budget.total_cost_pyg)}</strong>
          </div>
          <div className="flex justify-between text-emerald-400 font-bold pt-1.5 border-t border-slate-800">
            <span>Ganancia Estimada:</span>
            <span>{formatPYG(budget.total_sale_pyg - budget.total_cost_pyg)}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 text-slate-950 p-4 rounded-3xl space-y-1 text-right shadow-lg shadow-amber-500/20">
          <span className="text-[10px] text-slate-950/80 uppercase font-black tracking-wider block">
            Total Cliente (IVA 10% inc.)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">
            {formatPYG(budget.total_sale_pyg)}
          </div>
        </div>
      </div>

    </div>
  );
}

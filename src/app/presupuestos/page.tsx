'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Download, 
  Copy, 
  Trash2, 
  FileSpreadsheet, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock,
  Share2,
  ArrowRight
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

  const handleShareWhatsApp = (b: Budget) => {
    const phone = b.client.phone ? b.client.phone.replace(/[^0-9]/g, '') : '';
    const text = `*PRESUPUESTO ELÉCTRICO ${b.budget_number}* ⚡\n` +
      `*De:* Construlogica Emprendimientos S.A.\n` +
      `*Cliente:* ${b.client.name}\n` +
      `*Obra / Trabajo:* ${b.title}\n\n` +
      `💰 *Total Presupuesto:* ${formatPYG(b.total_sale_pyg)} (IVA 10% incluido)\n` +
      `⏱️ *Validez:* ${b.validity_days} días\n` +
      `📦 *Entrega:* ${b.delivery_terms}\n` +
      `💳 *Pago:* ${b.payment_terms}\n\n` +
      `_Presupuesto oficial emitido por ElectroCotiza._`;

    const encoded = encodeURIComponent(text);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
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
    <div className="max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* ENCABEZADO MÓVIL */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Presupuestos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cotizaciones oficiales para clientes y WhatsApp
          </p>
        </div>

        <Link
          href="/presupuestos/nuevo"
          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black px-3.5 py-2 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Nuevo</span>
        </Link>
      </div>

      {/* FILTROS DE ESTADO MÓVIL HORIZONTALES */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'draft', label: 'Borradores' },
          { key: 'sent', label: 'Enviados' },
          { key: 'accepted', label: 'Aceptados' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              filterStatus === tab.key
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-[#0F1E33] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LISTADO DE TARJETAS MÓVILES */}
      <div className="space-y-3">
        {filteredBudgets.length === 0 ? (
          <div className="bg-[#0F1E33] border border-slate-800 rounded-3xl p-8 text-center space-y-2">
            <p className="text-xs text-slate-400">No se encontraron presupuestos en esta categoría.</p>
          </div>
        ) : (
          filteredBudgets.map((b) => (
            <div
              key={b.id}
              className="bg-[#0F1E33] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 hover:border-slate-700 transition-all"
            >
              {/* TOP: NÚMERO Y ESTADO */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-400/30">
                    {b.budget_number}
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">
                    {formatDatePY(b.created_at.split('T')[0])}
                  </span>
                </div>

                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                  b.status === 'accepted'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : b.status === 'sent'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {b.status === 'accepted' ? 'Aceptado' : b.status === 'sent' ? 'Enviado' : 'Borrador'}
                </span>
              </div>

              {/* CUERPO: CLIENTE, TÍTULO Y MONTO */}
              <div className="flex items-end justify-between border-b border-slate-800/80 pb-3">
                <div className="min-w-0 pr-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                    {b.client.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {b.title} • {b.items.length} ítems
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                  <span className="text-sm sm:text-base font-black text-amber-400">
                    {formatPYG(b.total_sale_pyg)}
                  </span>
                </div>
              </div>

              {/* BOTONES TÁCTILES MÓVILES */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                <button
                  onClick={() => handleShareWhatsApp(b)}
                  className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  title="Compartir por WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Wsp</span>
                </button>

                <button
                  onClick={() => handleDownloadPDF(b)}
                  disabled={downloadingId === b.id}
                  className="py-2 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center space-x-1 shadow-md shadow-amber-400/20 active:scale-95 transition-all"
                  title="Descargar PDF Dorado"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{downloadingId === b.id ? '...' : 'PDF'}</span>
                </button>

                <Link
                  href={`/presupuestos/${b.id}`}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1 border border-slate-700 active:scale-95 transition-all"
                  title="Ver y Editar"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Ver</span>
                </Link>

                <button
                  onClick={() => handleDuplicate(b.id)}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1 border border-slate-700 active:scale-95 transition-all"
                  title="Duplicar Presupuesto"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Clonar</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

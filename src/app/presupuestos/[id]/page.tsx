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
  CheckCircle2, 
  Briefcase, 
  Layers, 
  FileText, 
  Lock, 
  AlertTriangle, 
  Check, 
  Plus, 
  Edit3, 
  RefreshCw 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, BudgetItem, QuoteStatus, UserProfile } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';
import { PricingEngine } from '@/lib/pricing-engine';
import { 
  generateClientPDF, 
  generateMaterialsListPDF, 
  generatePriceListPDF, 
  generateInternalCostSummaryPDF 
} from '@/lib/export/pdf-generator';

export default function PresupuestoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState(StorageService.getUserPermissions(null));
  
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const settings = StorageService.getSettings();

  const loadData = () => {
    if (id) {
      const b = StorageService.getBudgetById(id);
      if (b) {
        setBudget(b);
      } else {
        router.push('/presupuestos');
      }
    }
  };

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setPermissions(StorageService.getUserPermissions(user));
    loadData();
  }, [id, router]);

  if (!budget) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500 font-semibold">
        Cargando presupuesto...
      </div>
    );
  }

  // Cálculos reactivos mediante el Motor Centralizado
  const totals = PricingEngine.calculateQuoteTotals(budget, budget.default_iva_rate_pct || 10);

  const handleStatusChange = (newStatus: QuoteStatus) => {
    const res = StorageService.changeBudgetStatus(budget.id, newStatus);
    if (res.success) {
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleEmitRevision = () => {
    const rev = StorageService.emitBudgetRevision(budget.id, revisionNotes || 'Revisión técnica actualizada');
    if (rev) {
      loadData();
      setShowRevisionModal(false);
      setRevisionNotes('');
      alert(`¡Revisión ${rev.revision_number} emitida inmutable con éxito!`);
    }
  };

  const handleConvertToProject = () => {
    if (budget.status !== 'accepted') {
      const confirmApprove = confirm('Para convertir a proyecto, el presupuesto debe estar Aprobado. ¿Deseas aprobarlo ahora?');
      if (!confirmApprove) return;
    }

    const res = StorageService.convertBudgetToProject(
      budget.id, 
      currentUser?.full_name || 'Ramón Fleitas', 
      new Date().toISOString().split('T')[0]
    );

    if (res.success && res.project) {
      alert(res.message);
      router.push(`/proyectos/${res.project.id}`);
    } else {
      alert(res.message);
    }
  };

  const handleDownloadPDF = async (type: 'client' | 'materials' | 'pricelist' | 'internal') => {
    try {
      setDownloadingType(type);
      let doc;
      let filename = '';

      if (type === 'client') {
        doc = await generateClientPDF(budget, settings);
        filename = `Presupuesto_${budget.budget_number}_${budget.client.name.replace(/\s+/g, '_')}.pdf`;
      } else if (type === 'materials') {
        doc = await generateMaterialsListPDF(budget, settings);
        filename = `Lista_Materiales_${budget.budget_number}_Panol.pdf`;
      } else if (type === 'pricelist') {
        doc = await generatePriceListPDF(budget, settings);
        filename = `Tarifario_Comercial_${budget.budget_number}.pdf`;
      } else if (type === 'internal') {
        if (!permissions.canViewCosts) {
          alert('No tienes permiso para ver los costos internos.');
          return;
        }
        doc = await generateInternalCostSummaryPDF(budget, settings);
        filename = `Resumen_Costos_${budget.budget_number}_CONFIDENCIAL.pdf`;
      }

      if (doc) doc.save(filename);
    } catch (err) {
      console.error('Error al generar PDF', err);
      alert('Error al generar el documento PDF.');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*PRESUPUESTO ELÉCTRICO* ⚡\n*Construlogica Emprendimientos S.A.*\n\n*Cliente:* ${budget.client.name}\n*Comprobante:* ${budget.budget_number}\n*Total:* ${formatPYG(budget.total_sale_pyg)} (IVA 10% incluido)\n*Validez:* ${budget.validity_days || 15} días\n\n_Generado profesionalmente por ElectroCotiza._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyBank = () => {
    const text = `*DATOS PARA TRANSFERENCIA BANCARIA (SIPAP)*\nBanco: ${settings.bank_name}\nTitular: ${settings.bank_account_holder}\nCta Cte: ${settings.bank_account_number}\nRUC: ${settings.ruc}\nAlias SIPAP: ${settings.bank_sipap_alias}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* BARRA SUPERIOR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href="/presupuestos" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                {budget.budget_number}
              </span>
              {budget.current_revision ? (
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                  Rev. {budget.current_revision}
                </span>
              ) : null}
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {budget.status}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {budget.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleConvertToProject}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm flex items-center space-x-1"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Convertir a Proyecto</span>
          </button>
        </div>
      </div>

      {/* TARJETAS RESUMEN ECONÓMICO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">Cliente</span>
          <span className="font-bold text-slate-900 text-sm block truncate">{budget.client.name}</span>
          <span className="text-[10px] text-slate-500 font-mono">{budget.client.ruc_or_ci || 'S/ RUC'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">Subtotal Neto</span>
          <span className="font-bold font-mono text-slate-800 text-sm block">{formatPYG(totals.subtotalNet)}</span>
          <span className="text-[10px] text-slate-500">Base Imponible</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">IVA 10% Liquidado</span>
          <span className="font-bold font-mono text-slate-800 text-sm block">{formatPYG(totals.ivaAmount)}</span>
          <span className="text-[10px] text-slate-500">Impuesto al Valor Agregado</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">Total Facturado</span>
          <span className="font-black font-mono text-blue-900 text-base block">{formatPYG(totals.totalSale)}</span>
          <span className="text-[10px] text-slate-500">{budget.items?.length || 0} ítems</span>
        </div>
      </div>

      {/* BOTONES DE DESCARGA DE LOS 4 DOCUMENTOS PDF */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Descarga Oficial de Documentos:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            disabled={downloadingType !== null}
            onClick={() => handleDownloadPDF('client')}
            className="p-3 text-left border border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-900 block">Presupuesto Comercial</span>
              <span className="text-[10px] text-amber-800/80">Ejecutivo para Cliente</span>
            </div>
          </button>

          <button
            type="button"
            disabled={downloadingType !== null}
            onClick={() => handleDownloadPDF('materials')}
            className="p-3 text-left border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center space-x-2"
          >
            <Layers className="w-4 h-4 text-slate-700 shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Lista de Materiales</span>
              <span className="text-[10px] text-slate-500">Para Pañol y Compras</span>
            </div>
          </button>

          <button
            type="button"
            disabled={downloadingType !== null}
            onClick={() => handleDownloadPDF('pricelist')}
            className="p-3 text-left border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-slate-700 shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Tarifario de Precios</span>
              <span className="text-[10px] text-slate-500">Ítems con Precios Unitarios</span>
            </div>
          </button>

          <button
            type="button"
            disabled={downloadingType !== null || !permissions.canViewCosts}
            onClick={() => handleDownloadPDF('internal')}
            className={`p-3 text-left border rounded-lg flex items-center space-x-2 ${
              permissions.canViewCosts ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-950' : 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
            }`}
          >
            <Lock className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <span className="font-bold text-xs block">Hoja Costos y Rentabilidad</span>
              <span className="text-[10px] opacity-75">Confidencial Interno</span>
            </div>
          </button>
        </div>
      </div>

      {/* TABLA DE ÍTEMS DEL PRESUPUESTO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase">
            Detalle de Conceptos y Materiales
          </h3>
          <span className="text-xs text-slate-500">
            Validez: {budget.validity_days || 15} días corridos • Plazo: {budget.delivery_terms}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Descripción de Material / Trabajo</th>
                <th className="py-2.5 px-2 w-16 text-center">Unidad</th>
                <th className="py-2.5 px-2 w-20 text-right">Cantidad</th>
                <th className="py-2.5 px-3 w-32 text-right">Precio Unit. (IVA Inc.)</th>
                <th className="py-2.5 px-3 w-36 text-right">Total (Gs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budget.items.map((it, idx) => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400">{it.hierarchical_number || idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {it.description}
                    {it.provider_name && permissions.canViewCosts && (
                      <span className="ml-2 text-[10px] text-slate-400 font-mono">[{it.provider_name}]</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600 font-semibold">{it.unit}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">{it.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatPYG(it.unit_sale_pyg)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">{formatPYG(it.total_sale_pyg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  PlusCircle, 
  FileText, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Download,
  Building,
  Sparkles,
  Receipt
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, IngestedInvoice, CanonicalProduct } from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [invoices, setInvoices] = useState<IngestedInvoice[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(StorageService.getProducts());
    setBudgets(StorageService.getBudgets());
    setInvoices(StorageService.getInvoices());
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

  // Precios desactualizados (> 60 días)
  const staleCount = products.filter(p => isPriceStale(p.last_price_date, 60)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* BANNER PRINCIPAL / HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2137] via-[#162C4E] to-[#0A1626] text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Construlogica Emprendimientos S.A. • Alto Paraná</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Cotizador Eléctrico Inteligente <br className="hidden sm:inline" />
            <span className="text-amber-400">Precios y Presupuestos en Minutos</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Compara precios de ferreterías locales (Enerluz, Fixopar, Electro System, Luminotecnia), unifica nombres con el catálogo maestro y genera presupuestos con marco dorado sin revelar tus costos de compra.
          </p>

          {/* BUSCADOR RÁPIDO */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar material (ej. 'cable 2.5', 'barra cobre 20x3', 'disyuntor abb', 'bulon 10x25')..."
                className="w-full pl-12 pr-28 py-3.5 bg-slate-900/90 text-white placeholder-slate-400 rounded-2xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm sm:text-base shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* MÉTRICAS CLAVE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Catálogo Maestro</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{products.length}</div>
            <p className="text-xs text-slate-500 mt-1">Materiales unificados con alias</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Facturas Ingestadas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{invoices.length}</div>
            <p className="text-xs text-slate-500 mt-1">Enerluz, Fixopar y ABB</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Presupuestos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{budgets.length}</div>
            <p className="text-xs text-slate-500 mt-1">Listos para emitir PDF</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Alerta de Precios</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${staleCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{staleCount}</div>
            <p className="text-xs text-slate-500 mt-1">Precios mayores a 60 días</p>
          </div>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS EN PANTALLA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/presupuestos/nuevo"
          className="group p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <PlusCircle className="w-5 h-5" />
              <span className="text-base font-extrabold">Armar Presupuesto</span>
            </div>
            <p className="text-xs text-amber-950/80 font-medium">Cotiza 20 ítems en menos de 5 minutos</p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/ingesta"
          className="group p-5 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span className="text-base">Revisar Facturas Reales</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">5 facturas de Enerluz y Fixopar listas</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/catalogo"
          className="group p-5 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <span className="text-base">Comparar Precios</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Ver dónde conviene comprar cada ítem</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* SECCIÓN DOBLE: PRESUPUESTOS RECIENTES Y FACTURAS REALES CARGADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PRESUPUESTOS RECIENTES */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span>Presupuestos Recientes</span>
            </h2>
            <Link href="/presupuestos" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              Ver todos →
            </Link>
          </div>

          <div className="space-y-3">
            {budgets.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between space-x-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{b.title}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                      {b.budget_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    Cliente: <strong className="text-slate-700">{b.client.name}</strong> • {formatDatePY(b.created_at.split('T')[0])}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {formatPYG(b.total_sale_pyg)}{' '}
                    <span className="text-[10px] font-normal text-slate-500">(IVA 10% inc.)</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadPDF(b)}
                    disabled={downloadingId === b.id}
                    className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-sm"
                    title="Descargar PDF para Cliente (Marco Dorado)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/presupuestos/${b.id}`}
                    className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all"
                    title="Editar Presupuesto"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FACTURAS Y TICKETS DE ENERLUZ Y FIXOPAR CARGADOS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span>Facturas Reales de Entrenamiento</span>
            </h2>
            <Link href="/ingesta" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Ir al Validador →
            </Link>
          </div>

          <div className="space-y-3">
            {invoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center space-x-3"
              >
                {/* Miniatura de la foto de la factura */}
                <div className="w-12 h-14 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center relative">
                  <img
                    src={inv.file_url}
                    alt={inv.invoice_number}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{inv.provider_name}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                      {inv.invoice_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDatePY(inv.issue_date)} • {inv.items.length} ítems extraídos
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    Total: {formatPYG(inv.total_pyg)}
                  </p>
                </div>

                <Link
                  href="/ingesta"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors shrink-0"
                >
                  Ver foto
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

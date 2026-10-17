'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  FileText, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Download,
  Building,
  Sparkles,
  Receipt,
  Camera,
  Share2,
  Copy,
  Zap,
  HardHat,
  Cloud,
  ExternalLink
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, IngestedInvoice, CanonicalProduct, UserProfile } from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [invoices, setInvoices] = useState<IngestedInvoice[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedSipap, setCopiedSipap] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('Verificando...');

  useEffect(() => {
    setCurrentUser(StorageService.getCurrentUser());
    setProducts(StorageService.getProducts());
    setBudgets(StorageService.getBudgets());
    setInvoices(StorageService.getInvoices());

    // Verificar salud de Neon DB en segundo plano
    fetch('/api/db/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          setDbStatus(`Neon Cloud • ${data.stats?.products || 13} productos`);
        } else {
          setDbStatus('Local-First (En Memoria)');
        }
      })
      .catch(() => setDbStatus('Modo Offline'));
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

  const handleShareWhatsApp = (budget: Budget) => {
    const text = `*PRESUPUESTO ELÉCTRICO* ⚡\n*Construlogica Emprendimientos S.A.*\n\n*Cliente:* ${budget.client.name}\n*Comprobante:* ${budget.budget_number}\n*Total:* ${formatPYG(budget.total_sale_pyg)} (IVA 10% incluido)\n*Validez:* 15 días\n\n_Generado profesionalmente por ElectroCotiza._`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopySipap = () => {
    const settings = StorageService.getSettings();
    const text = `*DATOS PARA TRANSFERENCIA SIPAP*\nEmpresa: ${settings.company_name}\nRUC: ${settings.ruc}\nBanco: ${settings.bank_name || 'Banco Itaú Paraguay'}\nCta Cte: ${settings.bank_account_number || '720014589'}\nAlias SIPAP: ${settings.bank_sipap_alias || 'construlogica.py'}`;
    navigator.clipboard.writeText(text);
    setCopiedSipap(true);
    setTimeout(() => setCopiedSipap(false), 3000);
  };

  const totalCotizado = budgets.reduce((acc, b) => acc + (b.total_sale_pyg || 0), 0);
  const staleCount = products.filter(p => isPriceStale(p.last_price_date, 60)).length;

  return (
    <div className="max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* 1. CABECERA NATIVA MÓVIL: SALUDO Y ESTADO DE OBRA */}
      <div className="bg-[#0F1E33] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-400/30">
              {currentUser?.full_name?.substring(0, 2).toUpperCase() || 'LD'}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-400">¡Hola, {currentUser?.full_name?.split(' ')[0] || 'Lucas'}! 👋</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white leading-tight">
                Construlogica Emprendimientos
              </h1>
            </div>
          </div>

          {/* BADGE DE ESTADO DE BASE DE DATOS */}
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[120px]">{dbStatus}</span>
          </div>
        </div>

        {/* BUSCADOR RÁPIDO DE PRECIOS */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar precios de cables, disyuntores, caños..."
            className="w-full pl-10 pr-20 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all active:scale-95"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* 2. DOCK DE ACCIONES RÁPIDAS (BOTONES DE PULGAR) */}
      <div className="grid grid-cols-2 gap-3">
        {/* BOTÓN PRIMARIO: NUEVA COTIZACIÓN */}
        <Link
          href="/presupuestos/nuevo"
          className="p-4 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex flex-col justify-between group border border-amber-300"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-950/20 flex items-center justify-center">
              <Plus className="w-6 h-6 stroke-[3] text-slate-950" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full">
              Rápido
            </span>
          </div>

          <div className="mt-4">
            <span className="text-sm sm:text-base font-black block leading-tight">
              + Cotizar Obra
            </span>
            <span className="text-[11px] font-bold text-slate-900/80 block mt-0.5">
              Generar presupuesto
            </span>
          </div>
        </Link>

        {/* BOTÓN SECUNDARIO: ESCANEAR FACTURA */}
        <Link
          href="/ingesta"
          className="p-4 rounded-3xl bg-[#0F1E33] border border-slate-700/80 text-white shadow-md active:scale-95 transition-all flex flex-col justify-between group hover:border-amber-400/50"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cámara/Manual
            </span>
          </div>

          <div className="mt-4">
            <span className="text-sm sm:text-base font-black block leading-tight text-white group-hover:text-amber-300">
              Escanear Factura
            </span>
            <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">
              Guardar precio de compra
            </span>
          </div>
        </Link>
      </div>

      {/* 3. CHIPS HORIZONTALES CON MÉTRICAS CLAVE DE OBRA */}
      <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
        
        <div className="bg-[#0F1E33] border border-slate-800 rounded-2xl px-3.5 py-2 shrink-0 flex items-center space-x-2.5 shadow-sm">
          <div className="w-7 h-7 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center text-xs font-black">
            ₲
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Cotizado este mes</span>
            <span className="text-xs font-black text-white">{formatPYG(totalCotizado)}</span>
          </div>
        </div>

        <div className="bg-[#0F1E33] border border-slate-800 rounded-2xl px-3.5 py-2 shrink-0 flex items-center space-x-2.5 shadow-sm">
          <div className="w-7 h-7 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center text-xs font-black">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Facturas auditadas</span>
            <span className="text-xs font-black text-white">{invoices.length} comprobantes</span>
          </div>
        </div>

        <div className="bg-[#0F1E33] border border-slate-800 rounded-2xl px-3.5 py-2 shrink-0 flex items-center space-x-2.5 shadow-sm">
          <div className="w-7 h-7 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center text-xs font-black">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Catálogo unificado</span>
            <span className="text-xs font-black text-white">{products.length} materiales</span>
          </div>
        </div>

        {/* ACCIÓN RÁPIDA SIPAP */}
        <button
          onClick={handleCopySipap}
          className="bg-[#0F1E33] hover:bg-slate-800 border border-amber-400/30 rounded-2xl px-3.5 py-2 shrink-0 flex items-center space-x-2.5 shadow-sm active:scale-95 transition-all"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
            <Copy className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-amber-300 block font-bold">
              {copiedSipap ? '¡Copiado al Portapapeles!' : 'Cuenta SIPAP Itaú'}
            </span>
            <span className="text-xs font-mono font-bold text-white">720014589</span>
          </div>
        </button>

      </div>

      {/* 4. FEED DE PRESUPUESTOS (TARJETAS NATIVAS MÓVILES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
              Presupuestos Recientes ({budgets.length})
            </h2>
          </div>
          <Link href="/presupuestos" className="text-[11px] font-bold text-amber-400 hover:text-amber-300">
            Ver todos →
          </Link>
        </div>

        {budgets.length === 0 ? (
          <div className="p-8 text-center bg-[#0F1E33] rounded-3xl border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 font-medium">Aún no hay cotizaciones creadas.</p>
            <Link
              href="/presupuestos/nuevo"
              className="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-black rounded-xl text-xs"
            >
              Crear primera cotización
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {budgets.map((b) => (
              <div
                key={b.id}
                className="bg-[#0F1E33] border border-slate-800 rounded-3xl p-4 shadow-lg space-y-3 hover:border-slate-700 transition-all"
              >
                {/* FILA SUPERIOR: N° Y FECHA */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-400/30">
                      {b.budget_number}
                    </span>
                    <span className="text-slate-400 text-[11px] font-medium">
                      {formatDatePY(b.created_at.split('T')[0])}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Aprobado
                  </span>
                </div>

                {/* FILA CENTRAL: CLIENTE Y MONTO */}
                <div className="flex items-end justify-between border-b border-slate-800/80 pb-3">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                      {b.client.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {b.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Cliente</span>
                    <span className="text-sm sm:text-base font-black text-amber-400">
                      {formatPYG(b.total_sale_pyg)}
                    </span>
                  </div>
                </div>

                {/* FILA INFERIOR: BOTONES DE ACCIÓN DE 1 TOQUE (WHATSAPP + PDF DORADO) */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <button
                    onClick={() => handleShareWhatsApp(b)}
                    className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                    title="Enviar por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPDF(b)}
                    disabled={downloadingId === b.id}
                    className="py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-400/20 active:scale-95 transition-all"
                    title="Descargar PDF con Marco Dorado"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === b.id ? 'Generando...' : 'PDF'}</span>
                  </button>

                  <Link
                    href={`/presupuestos/${b.id}`}
                    className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1 border border-slate-700 active:scale-95 transition-all"
                  >
                    <span>Editar</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. FEED DE FACTURAS REALES DE PARAGUAY CARGADAS */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
              Últimas Facturas Registradas ({invoices.length})
            </h2>
          </div>
          <Link href="/ingesta" className="text-[11px] font-bold text-amber-400 hover:text-amber-300">
            Ver todas →
          </Link>
        </div>

        <div className="space-y-2">
          {invoices.slice(0, 4).map((inv) => (
            <div
              key={inv.id}
              className="bg-[#0F1E33] border border-slate-800 rounded-2xl p-3 flex items-center justify-between space-x-3 text-xs"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">
                    {inv.provider_name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Nº {inv.invoice_number} • {formatDatePY(inv.issue_date)}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-emerald-400 block">
                  {formatPYG(inv.total_pyg)}
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold uppercase">
                  Auditada ✓
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. BANNER DE CONTACTO Y SOPORTE DE OBRA */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-[#0F1E33] border border-slate-800 text-center space-y-1">
        <p className="text-[11px] font-bold text-slate-300">
          ElectroCotiza • Diseñado para contratistas en terreno
        </p>
        <p className="text-[10px] text-slate-500">
          Construlogica Emprendimientos S.A. • Alto Paraná, Paraguay
        </p>
      </div>

    </div>
  );
}

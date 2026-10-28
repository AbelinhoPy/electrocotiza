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
  Briefcase, 
  Layers, 
  Wrench, 
  ShieldCheck, 
  BarChart3, 
  Users, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Building2 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { 
  Budget, 
  IngestedInvoice, 
  CanonicalProduct, 
  UserProfile, 
  Project, 
  ServiceOrder, 
  InventoryStock 
} from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState(StorageService.getUserPermissions(null));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [invoices, setInvoices] = useState<IngestedInvoice[]>([]);
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedSipap, setCopiedSipap] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('Verificando...');

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setPermissions(StorageService.getUserPermissions(user));

    setProducts(StorageService.getProducts());
    setBudgets(StorageService.getBudgets());
    setProjects(StorageService.getProjects());
    setServiceOrders(StorageService.getServiceOrders());
    setStocks(StorageService.getStocks());
    setInvoices(StorageService.getInvoices());

    // Verificar salud de Neon DB
    fetch('/api/db/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          setDbStatus(`Neon Cloud • ${data.stats?.products || 13} productos`);
        } else {
          setDbStatus('Local-First Activo');
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
    const text = `*PRESUPUESTO ELÉCTRICO* ⚡\n*Construlogica Emprendimientos S.A.*\n\n*Cliente:* ${budget.client.name}\n*Comprobante:* ${budget.budget_number}\n*Total:* ${formatPYG(budget.total_sale_pyg)} (IVA 10% incluido)\n*Validez:* 15 días\n\n_Generado profesionalmente por el Sistema Comercial._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopySipap = () => {
    const settings = StorageService.getSettings();
    const text = `*DATOS PARA TRANSFERENCIA SIPAP*\nEmpresa: ${settings.company_name}\nRUC: ${settings.ruc}\nBanco: ${settings.bank_name || 'Banco Itaú Paraguay'}\nCta Cte: ${settings.bank_account_number || '720014589'}\nAlias SIPAP: ${settings.bank_sipap_alias || 'construlogica.py'}`;
    navigator.clipboard.writeText(text);
    setCopiedSipap(true);
    setTimeout(() => setCopiedSipap(false), 3000);
  };

  // --- CÁLCULO DE LOS 7 INDICADORES EXIGIDOS POR EL REQUERIMIENTO ---
  // 1. Presupuestos por estado
  const presupuestosBorrador = budgets.filter(b => b.status === 'draft').length;
  const presupuestosPendientes = budgets.filter(b => b.status === 'pending_authorization').length;
  const presupuestosEnviados = budgets.filter(b => b.status === 'sent').length;
  const presupuestosAprobados = budgets.filter(b => b.status === 'accepted').length;

  // 2. Importe total presupuestos enviados
  const importeEnviados = budgets
    .filter(b => b.status === 'sent')
    .reduce((acc, b) => acc + (b.total_sale_pyg || 0), 0);

  // 3. Importe presupuestos aprobados
  const importeAprobados = budgets
    .filter(b => b.status === 'accepted')
    .reduce((acc, b) => acc + (b.total_sale_pyg || 0), 0);

  // 4. Proyectos activos
  const proyectosActivos = projects.filter(p => p.status === 'en_ejecucion' || p.status === 'en_pruebas').length;

  // 5. Materiales pendientes de recepción en obras
  let materialesPendientesRecepcion = 0;
  projects.forEach(p => {
    p.materials?.forEach(m => {
      if ((m.quantity_pending || 0) > 0) materialesPendientesRecepcion++;
    });
  });

  // 6. Precios desactualizados (> 60 días)
  const staleCount = products.filter(p => isPriceStale(p.last_price_date, 60)).length;

  // 7. Órdenes de servicio pendientes
  const ordenesPendientes = serviceOrders.filter(o => o.status === 'pendiente' || o.status === 'en_proceso').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* 1. HERO CABECERA: SALUDO Y BUSCADOR INTELIGENTE */}
      <div className="bg-[#0B1526] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-md shadow-amber-400/25">
              {currentUser?.full_name?.substring(0, 2).toUpperCase() || 'LD'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">¡Hola, {currentUser?.full_name?.split(' ')[0] || 'Lucas'}!</span>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 uppercase">
                  Rol: {currentUser?.role}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-white leading-tight">
                Panel de Control Comercial & Operativo
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{dbStatus}</span>
            </div>
          </div>
        </div>

        {/* BUSCADOR RÁPIDO DE PRECIOS */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar precios de materiales: cable 2.5mm, disyuntor ABB, planchuela de cobre, caño corrugado..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs transition-all active:scale-95"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* 2. LOS 7 INDICADORES OPERATIVOS Y COMERCIALES (KPIS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        
        {/* KPI 1: Presupuestos por Estado */}
        <Link href="/presupuestos" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Presupuestos por Estado</span>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800" title="Enviados">
              {presupuestosEnviados} env
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800" title="Aprobados">
              {presupuestosAprobados} apr
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800" title="Pendientes">
              {presupuestosPendientes} pend
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1.5">Total {budgets.length} cotizaciones</span>
        </Link>

        {/* KPI 2: Importe Presupuestos Enviados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Enviados en Negociación</span>
          <div className="text-base sm:text-lg font-black text-blue-900 font-mono mt-1 truncate">
            {formatPYG(importeEnviados)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Ofertas activas con clientes</span>
        </div>

        {/* KPI 3: Presupuestos Aprobados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Contratos Aprobados</span>
          <div className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-1 truncate">
            {formatPYG(importeAprobados)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{presupuestosAprobados} obras aceptadas</span>
        </div>

        {/* KPI 4: Proyectos Activos */}
        <Link href="/proyectos" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Proyectos Activos</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {proyectosActivos}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold block mt-1">En ejecución y comisionamiento →</span>
        </Link>

        {/* KPI 5: Materiales Pendientes de Recepción */}
        <Link href="/inventario" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Materiales Pend. Obra</span>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {materialesPendientesRecepcion}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Líneas pendientes en pañol</span>
        </Link>

        {/* KPI 6: Precios Desactualizados (> 60 días) */}
        <Link href="/catalogo" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Precios Viejos (&gt; 60 d)</span>
          <div className="text-2xl font-black text-rose-700 font-mono mt-1">
            {staleCount}
          </div>
          <span className="text-[10px] text-rose-600 font-semibold block mt-1">Requieren actualización →</span>
        </Link>

        {/* KPI 7: Órdenes de Servicio Pendientes */}
        <Link href="/ordenes-servicio" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Órdenes de Servicio</span>
          <div className="text-2xl font-black text-blue-800 font-mono mt-1">
            {ordenesPendientes} pend
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{serviceOrders.length} órdenes en total</span>
        </Link>

        {/* ACCIÓN RÁPIDA SIPAP */}
        <button
          type="button"
          onClick={handleCopySipap}
          className="bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl p-4 text-left transition-colors"
        >
          <span className="text-[11px] font-bold text-amber-900 uppercase block">Cuenta SIPAP Continental</span>
          <div className="text-sm font-mono font-black text-slate-900 mt-1">
            {copiedSipap ? '¡Copiado al Portapapeles!' : '01-248900-05'}
          </div>
          <span className="text-[10px] text-amber-800 block mt-1">Click para copiar datos de pago</span>
        </button>

      </div>

      {/* 3. HUB DE MÓDULOS DEL SISTEMA */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Acceso Rápido a Módulos Conectados:
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          
          <Link href="/presupuestos" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <FileText className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Presupuestos</span>
            <span className="text-[10px] text-slate-400">8 Etapas</span>
          </Link>

          <Link href="/proyectos" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Briefcase className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Proyectos</span>
            <span className="text-[10px] text-slate-400">Seguimiento</span>
          </Link>

          <Link href="/finanzas" className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all group text-center">
            <DollarSign className="w-6 h-6 text-emerald-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Finanzas</span>
            <span className="text-[10px] text-slate-400">Hitos & Gastos</span>
          </Link>

          <Link href="/inventario" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Layers className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Inventario</span>
            <span className="text-[10px] text-slate-400">Almacenes</span>
          </Link>

          <Link href="/ordenes-servicio" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Wrench className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Órdenes (OS)</span>
            <span className="text-[10px] text-slate-400">Técnicas</span>
          </Link>

          <Link href="/checklists" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <ShieldCheck className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Checklists</span>
            <span className="text-[10px] text-slate-400">Normas ANDE</span>
          </Link>

          <Link href="/reportes" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <BarChart3 className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Reportes</span>
            <span className="text-[10px] text-slate-400">Exportar CSV</span>
          </Link>

        </div>
      </div>

      {/* 4. ÚLTIMOS PRESUPUESTOS Y ACCIÓN DIRECTA */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Presupuestos Recientes ({budgets.length}):
          </h2>
          <Link href="/presupuestos" className="text-xs font-bold text-blue-700 hover:text-blue-900">
            Ver Listado Completo →
          </Link>
        </div>

        <div className="space-y-3">
          {budgets.slice(0, 5).map(b => (
            <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-blue-900">{b.budget_number}</span>
                  <span className="text-slate-400 font-mono">{formatDatePY(b.created_at.split('T')[0])}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {b.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{b.title}</h3>
                <span className="text-slate-600">Cliente: <strong>{b.client.name}</strong></span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Facturado</span>
                  <span className="font-mono font-black text-slate-950 text-base">{formatPYG(b.total_sale_pyg)}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(b)}
                    disabled={downloadingId === b.id}
                    className="p-2 text-slate-600 hover:bg-white hover:text-blue-900 border border-slate-300 rounded-lg transition-colors"
                    title="Descargar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(b)}
                    className="p-2 text-emerald-700 hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors"
                    title="Compartir por WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

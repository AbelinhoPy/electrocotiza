'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  Share2, 
  Briefcase, 
  Layers, 
  Wrench, 
  ShieldCheck, 
  BarChart3, 
  Users, 
  DollarSign, 
  Package, 
  Camera, 
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { 
  Budget, 
  CanonicalProduct, 
  Project, 
  ServiceOrder, 
  UserProfile 
} from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';
import { useAuth } from '@/lib/auth/AuthContext';

const STATUS_SPANISH: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-700' },
  pending_authorization: { label: 'Pend. Autorización', bg: 'bg-amber-100', text: 'text-amber-800' },
  sent: { label: 'Enviado', bg: 'bg-blue-100', text: 'text-blue-800' },
  accepted: { label: 'Aprobado', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  rejected: { label: 'Rechazado', bg: 'bg-rose-100', text: 'text-rose-800' },
  expired: { label: 'Vencido', bg: 'bg-orange-100', text: 'text-orange-800' },
  cancelled: { label: 'Anulado', bg: 'bg-red-100', text: 'text-red-800' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, isAdmin, isSecretaria } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedSipap, setCopiedSipap] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('Verificando...');

  useEffect(() => {
    setProducts(StorageService.getProducts());
    setBudgets(StorageService.getBudgets());
    setProjects(StorageService.getProjects());
    setServiceOrders(StorageService.getServiceOrders());

    // Estado del sistema
    fetch('/api/db/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          setDbStatus('Sistema Conectado');
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
    const text = `*PRESUPUESTO ELÉCTRICO* ⚡\n*Construlogica Emprendimientos S.A.*\n\n*Cliente:* ${budget.client.name}\n*Comprobante:* ${budget.budget_number}\n*Total:* ${formatPYG(budget.total_sale_pyg)} (IVA 10% incluido)\n*Validez:* 15 días\n\n_Generado por ElectroCotiza._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopySipap = () => {
    const settings = StorageService.getSettings();
    const text = `*DATOS PARA TRANSFERENCIA SIPAP*\nEmpresa: ${settings.company_name}\nRUC: ${settings.ruc}\nBanco: ${settings.bank_name || 'Banco Itaú Paraguay'}\nCta Cte: ${settings.bank_account_number || '720014589'}\nAlias SIPAP: ${settings.bank_sipap_alias || 'construlogica.py'}`;
    navigator.clipboard.writeText(text);
    setCopiedSipap(true);
    setTimeout(() => setCopiedSipap(false), 3000);
  };

  // Indicadores
  const presupuestosBorrador = budgets.filter(b => b.status === 'draft').length;
  const presupuestosPendientes = budgets.filter(b => b.status === 'pending_authorization').length;
  const presupuestosEnviados = budgets.filter(b => b.status === 'sent').length;
  const presupuestosAprobados = budgets.filter(b => b.status === 'accepted').length;

  const importeEnviados = budgets
    .filter(b => b.status === 'sent')
    .reduce((acc, b) => acc + (b.total_sale_pyg || 0), 0);

  const importeAprobados = budgets
    .filter(b => b.status === 'accepted')
    .reduce((acc, b) => acc + (b.total_sale_pyg || 0), 0);

  const proyectosActivos = projects.filter(p => p.status === 'en_ejecucion' || p.status === 'en_pruebas').length;

  const firstName = authUser?.full_name?.split(' ')[0] || 'Bienvenido';
  const roleName = authUser?.role === 'admin' ? 'Administrador' : authUser?.role === 'secretaria' ? 'Secretaria' : authUser?.role || 'Usuario';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* 1. CABECERA CON BIENVENIDA Y ACCIONES RÁPIDAS PARA SECRETARIA */}
      <div className="bg-[#0B1526] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-md shadow-amber-400/25">
              {authUser?.full_name ? authUser.full_name.substring(0, 2).toUpperCase() : 'EC'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">¡Hola, {firstName}!</span>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  {roleName}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-white leading-tight">
                Panel de Gestión ElectroCotiza
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

        {/* ACCIONES RÁPIDAS PRINCIPALES (SECRETARIA PERSONA) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800/80">
          <Link
            href="/presupuestos/nuevo"
            className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-amber-400/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Nuevo Presupuesto</span>
          </Link>

          <Link
            href="/catalogo"
            className="p-3 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
          >
            <Package className="w-4 h-4 text-blue-400" />
            <span>Productos y Precios</span>
          </Link>

          <Link
            href="/ingesta"
            className="p-3 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Facturas de Compra</span>
          </Link>

          <Link
            href="/clientes"
            className="p-3 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>Clientes</span>
          </Link>
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
            className="absolute right-1.5 top-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all active:scale-95"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* 2. TARJETAS DE INDICADORES PRINCIPALES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* KPI 1: Presupuestos en Borrador */}
        <Link href="/presupuestos" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Borradores Pendientes</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {presupuestosBorrador}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold block mt-1">Listos para continuar →</span>
        </Link>

        {/* KPI 2: Presupuestos Enviados */}
        <Link href="/presupuestos" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Enviados al Cliente</span>
          <div className="text-base sm:text-lg font-black text-blue-900 font-mono mt-1 truncate">
            {formatPYG(importeEnviados)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{presupuestosEnviados} presupuestos activos</span>
        </Link>

        {/* KPI 3: Presupuestos Aprobados */}
        <Link href="/presupuestos" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Presupuestos Aprobados</span>
          <div className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-1 truncate">
            {formatPYG(importeAprobados)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{presupuestosAprobados} trabajos confirmados</span>
        </Link>

        {/* KPI 4: Proyectos Activos */}
        <Link href="/proyectos" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Proyectos Activos</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {proyectosActivos}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold block mt-1">En ejecución técnica →</span>
        </Link>

      </div>

      {/* 3. MÓDULOS DE GESTIÓN */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Módulos del Sistema:
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          
          <Link href="/presupuestos" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <FileText className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Presupuestos</span>
            <span className="text-[10px] text-slate-400">3 Pasos</span>
          </Link>

          <Link href="/catalogo" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Package className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Productos</span>
            <span className="text-[10px] text-slate-400">Precios y Marcas</span>
          </Link>

          <Link href="/ingesta" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Camera className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Facturas</span>
            <span className="text-[10px] text-slate-400">Compras de Obra</span>
          </Link>

          <Link href="/proyectos" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Briefcase className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Proyectos</span>
            <span className="text-[10px] text-slate-400">Montaje y Obras</span>
          </Link>

          <Link href="/clientes" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Users className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Clientes</span>
            <span className="text-[10px] text-slate-400">Empresas & Obras</span>
          </Link>

          <Link href="/inventario" className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center">
            <Layers className="w-6 h-6 text-blue-700 mx-auto group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 block mt-2">Inventario</span>
            <span className="text-[10px] text-slate-400">Pañol</span>
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
          {budgets.slice(0, 5).map(b => {
            const statusInfo = STATUS_SPANISH[b.status] || { label: b.status, bg: 'bg-slate-100', text: 'text-slate-700' };

            return (
              <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-900">{b.budget_number}</span>
                    <span className="text-slate-400 font-mono">{formatDatePY(b.created_at.split('T')[0])}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{b.title}</h3>
                  <span className="text-slate-600">Cliente: <strong>{b.client.name}</strong></span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total del Presupuesto</span>
                    <span className="font-mono font-black text-slate-950 text-base">{formatPYG(b.total_sale_pyg)}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <Link
                      href={`/presupuestos/nuevo?edit=${b.id}`}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                      title="Editar en el asistente"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(b)}
                      disabled={downloadingId === b.id}
                      className="p-1.5 text-slate-600 hover:bg-white hover:text-blue-900 border border-slate-300 rounded-lg transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(b)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

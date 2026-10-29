'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Download, 
  Copy, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  CheckCircle2, 
  Clock,
  Share2,
  Archive,
  ArrowRight,
  Briefcase,
  AlertTriangle,
  Send,
  XCircle,
  FileEdit,
  ShieldCheck,
  RefreshCw,
  Layers,
  ChevronDown
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, QuoteStatus, UserProfile } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';
import { 
  generateClientPDF, 
  generateMaterialsListPDF, 
  generatePriceListPDF, 
  generateInternalCostSummaryPDF 
} from '@/lib/export/pdf-generator';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  pending_authorization: { label: 'Pend. Autorización', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  sent: { label: 'Enviado', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  accepted: { label: 'Aprobado', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  rejected: { label: 'Rechazado', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  expired: { label: 'Vencido', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  cancelled: { label: 'Anulado', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

export default function PresupuestosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [permissions, setPermissions] = useState(StorageService.getUserPermissions(null));

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSalesperson, setFilterSalesperson] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Estados de carga
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [pdfMenuOpenId, setPdfMenuOpenId] = useState<string | null>(null);

  const loadBudgets = () => {
    setBudgets(StorageService.getBudgets());
  };

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setPermissions(StorageService.getUserPermissions(user));
    loadBudgets();
  }, []);

  // Transiciones de estado válidas según reglas de negocio
  const handleStatusChange = (budget: Budget, newStatus: QuoteStatus) => {
    const res = StorageService.changeBudgetStatus(budget.id, newStatus);
    if (res.success) {
      loadBudgets();
      setStatusMenuOpenId(null);
    } else {
      alert(res.message);
    }
  };

  const handleDuplicate = (id: string) => {
    const copy = StorageService.duplicateBudget(id);
    if (copy) {
      loadBudgets();
      alert(`Presupuesto duplicado como ${copy.budget_number}`);
    }
  };

  const handleToggleArchive = (id: string) => {
    StorageService.toggleArchiveBudget(id);
    loadBudgets();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este presupuesto? Esta acción es irreversible.')) {
      StorageService.deleteBudget(id);
      loadBudgets();
    }
  };

  const handleConvertToProject = (budget: Budget) => {
    if (budget.status !== 'accepted') {
      const confirmApprove = confirm(`El presupuesto debe estar en estado "Aprobado". ¿Deseas aprobarlo y convertirlo en Proyecto inmediatamente?`);
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

  const handleDownloadSpecificPDF = async (budget: Budget, type: 'client' | 'materials' | 'pricelist' | 'internal') => {
    try {
      setDownloadingId(`${budget.id}-${type}`);
      const settings = StorageService.getSettings();
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

      if (doc) {
        doc.save(filename);
      }
    } catch (err) {
      console.error('Error al generar PDF', err);
      alert('Error al generar el documento PDF.');
    } finally {
      setDownloadingId(null);
      setPdfMenuOpenId(null);
    }
  };

  // Filtrado reactivo en servidor/memoria
  const filteredBudgets = budgets.filter((b) => {
    // Archivado independiente
    if (!showArchived && b.is_archived) return false;
    if (showArchived && !b.is_archived) return false;

    // Estado
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;

    // Cliente
    if (filterClient && b.client.id !== filterClient && !b.client.name.toLowerCase().includes(filterClient.toLowerCase())) {
      return false;
    }

    // Vendedor
    if (filterSalesperson && !(b.salesperson_name || '').toLowerCase().includes(filterSalesperson.toLowerCase())) {
      return false;
    }

    // Fechas
    const bDate = b.created_at.split('T')[0];
    if (filterDateFrom && bDate < filterDateFrom) return false;
    if (filterDateTo && bDate > filterDateTo) return false;

    // Búsqueda de texto libre
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = b.budget_number.toLowerCase().includes(q);
      const matchTitle = (b.title || '').toLowerCase().includes(q);
      const matchProj = (b.project_name || '').toLowerCase().includes(q);
      const matchCli = b.client.name.toLowerCase().includes(q);
      const matchRuc = (b.client.ruc_or_ci || '').toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchProj && !matchCli && !matchRuc) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* ENCABEZADO Y ACCIONES PRINCIPALES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <span>Gestión de Presupuestos y Cotizaciones</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Numeración consecutiva PRES-AAAA-NNNN • Revisiones inmutables • Conexión directa a Proyectos.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/presupuestos/nuevo"
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Crear Presupuesto</span>
          </Link>
        </div>
      </div>

      {/* PANEL DE BÚSQUEDA Y FILTROS AVANZADOS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Texto Libre */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por número, cliente, RUC o proyecto..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Todos los Estados</option>
              <option value="draft">Borrador</option>
              <option value="pending_authorization">Pend. de Autorización</option>
              <option value="sent">Enviado al Cliente</option>
              <option value="accepted">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="expired">Vencido</option>
              <option value="cancelled">Anulado</option>
            </select>
          </div>

          {/* Filtro Fecha Desde */}
          <div>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            />
          </div>

          {/* Filtro Fecha Hasta */}
          <div>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-slate-500 border-t border-slate-100">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span>Mostrar Archivados ({budgets.filter(b => b.is_archived).length})</span>
            </label>
          </div>

          <span>Mostrando <strong>{filteredBudgets.length}</strong> de {budgets.length} presupuestos</span>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE PRESUPUESTOS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredBudgets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-700">No se encontraron presupuestos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Prueba cambiando los filtros o crea un nuevo presupuesto utilizando el asistente comercial.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F2137] text-white font-bold">
                <tr>
                  <th className="py-3 px-3 w-32">Número</th>
                  <th className="py-3 px-3">Proyecto / Obra</th>
                  <th className="py-3 px-3">Cliente / Razón Social</th>
                  <th className="py-3 px-2 w-24 text-center">Fecha</th>
                  <th className="py-3 px-2 w-16 text-center">Ítems</th>
                  <th className="py-3 px-3 w-28 text-right">Subtotal</th>
                  <th className="py-3 px-3 w-24 text-right">IVA 10%</th>
                  <th className="py-3 px-3 w-32 text-right">Total Presupuesto</th>
                  <th className="py-3 px-3 w-28 text-center">Estado</th>
                  <th className="py-3 px-3 w-40 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBudgets.map((b) => {
                  const statusInfo = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
                  const isMenuOpen = statusMenuOpenId === b.id;
                  const isPdfMenuOpen = pdfMenuOpenId === b.id;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Número comercial */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-900">
                        {b.budget_number}
                        {b.current_revision ? (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Rev. {b.current_revision}
                          </span>
                        ) : null}
                      </td>

                      {/* Proyecto */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                          {b.title}
                        </span>
                        {b.project_name && b.project_name !== b.title && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                            {b.project_name}
                          </span>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block truncate max-w-[180px]">
                          {b.client.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {b.client.ruc_or_ci || 'S/ RUC'}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-2 text-center text-slate-600">
                        {formatDatePY(b.created_at.split('T')[0])}
                      </td>

                      {/* Cantidad Ítems */}
                      <td className="py-3 px-2 text-center font-bold text-slate-700">
                        {b.items?.length || 0}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatPYG(b.subtotal_net_pyg || b.total_sale_pyg)}
                      </td>

                      {/* IVA 10% */}
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {formatPYG(b.iva_amount_pyg || 0)}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-950 text-sm">
                        {formatPYG(b.total_sale_pyg)}
                      </td>

                      {/* Estado y Transición */}
                      <td className="py-3 px-3 text-center relative">
                        <button
                          type="button"
                          onClick={() => setStatusMenuOpenId(isMenuOpen ? null : b.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center space-x-1 mx-auto ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span>{statusInfo.label}</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>

                        {/* Menú de cambio de estado */}
                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 z-30 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-44 text-left space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-bold px-2 py-1 block uppercase">Cambiar Estado:</span>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(b, 'draft')}
                              className="w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded text-slate-700"
                            >
                              Borrador
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(b, 'sent')}
                              className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded text-blue-700 font-semibold"
                            >
                              Marcar Enviado
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(b, 'accepted')}
                              className="w-full text-left px-2 py-1 text-xs hover:bg-emerald-50 rounded text-emerald-700 font-bold"
                            >
                              Aprobar Oferta
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(b, 'rejected')}
                              className="w-full text-left px-2 py-1 text-xs hover:bg-rose-50 rounded text-rose-700"
                            >
                              Rechazado
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(b, 'cancelled')}
                              className="w-full text-left px-2 py-1 text-xs hover:bg-red-50 rounded text-red-700"
                            >
                              Anular
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          
                          {/* Ver detalle */}
                          <Link
                            href={`/presupuestos/${b.id}`}
                            title="Ver Detalle del Presupuesto"
                            className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Editar en Asistente */}
                          <Link
                            href={`/presupuestos/nuevo?edit=${b.id}`}
                            title="Editar en el Asistente"
                            className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <FileEdit className="w-4 h-4" />
                          </Link>

                          {/* Menú PDF */}
                          <div className="relative">
                            <button
                              type="button"
                              title="Generar Documentos PDF"
                              onClick={() => setPdfMenuOpenId(isPdfMenuOpen ? null : b.id)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {isPdfMenuOpen && (
                              <div className="absolute right-0 mt-1 z-30 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-48 text-left space-y-0.5">
                                <span className="text-[10px] text-slate-400 font-bold px-2 py-1 block uppercase">Documentos PDF:</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSpecificPDF(b, 'client')}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-amber-50 rounded text-amber-900 font-bold"
                                >
                                  📄 Presupuesto Comercial
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSpecificPDF(b, 'materials')}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-100 rounded text-slate-700"
                                >
                                  📋 Lista de Materiales (Pañol)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSpecificPDF(b, 'pricelist')}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-100 rounded text-slate-700"
                                >
                                  💲 Lista de Precios
                                </button>
                                {permissions.canViewCosts && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadSpecificPDF(b, 'internal')}
                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-red-50 rounded text-red-700 font-semibold"
                                  >
                                    🔒 Hoja Costos Confidencial
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Convertir a Proyecto si aprobado o para aprobar */}
                          <button
                            type="button"
                            title="Convertir a Proyecto Operativo"
                            onClick={() => handleConvertToProject(b)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Briefcase className="w-4 h-4" />
                          </button>

                          {/* Duplicar */}
                          <button
                            type="button"
                            title="Duplicar Presupuesto"
                            onClick={() => handleDuplicate(b.id)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Archivar */}
                          <button
                            type="button"
                            title={b.is_archived ? 'Desarchivar' : 'Archivar'}
                            onClick={() => handleToggleArchive(b.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              b.is_archived ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            title="Eliminar Presupuesto"
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

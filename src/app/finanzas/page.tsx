'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { StorageService } from '@/lib/data/storage';
import { Project, ProjectPaymentMilestone, ProjectExpense } from '@/lib/types';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Receipt, 
  Building2, 
  Truck, 
  Coffee, 
  Package, 
  FileText,
  CreditCard
} from 'lucide-react';

export default function FinanzasPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [milestones, setMilestones] = useState<ProjectPaymentMilestone[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [activeTab, setActiveTab] = useState<'hitos' | 'gastos'>('hitos');

  // Modal para registrar cobro
  const [cobroModalMilestone, setCobroModalMilestone] = useState<ProjectPaymentMilestone | null>(null);
  const [cobroMonto, setCobroMonto] = useState<number>(0);
  const [cobroRecibo, setCobroRecibo] = useState<string>('');

  // Modal para nuevo gasto
  const [showGastoModal, setShowGastoModal] = useState<boolean>(false);
  const [nuevoGasto, setNuevoGasto] = useState<{
    projectId: string;
    concept: string;
    category: 'material_adicional' | 'transporte' | 'viaticos' | 'imprevisto' | 'subcontrato';
    amount_pyg: number;
    provider_or_recipient: string;
    receipt_number: string;
  }>({
    projectId: '',
    concept: '',
    category: 'material_adicional',
    amount_pyg: 0,
    provider_or_recipient: '',
    receipt_number: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const loadData = () => {
    const proys = StorageService.getProjects();
    setProjects(proys);

    const targetProjId = selectedProjectId === 'all' ? undefined : selectedProjectId;
    const mils = StorageService.getPaymentMilestones(targetProjId);
    const exps = StorageService.getProjectExpenses(targetProjId);

    setMilestones(mils);
    setExpenses(exps);

    if (proys.length > 0 && !nuevoGasto.projectId) {
      setNuevoGasto(prev => ({ ...prev, projectId: proys[0].id }));
    }
  };

  const formatGs = (val: number) => {
    return Math.round(val).toLocaleString('es-PY') + ' Gs.';
  };

  // KPIs
  const totalContratado = projects
    .filter(p => selectedProjectId === 'all' || p.id === selectedProjectId)
    .reduce((acc, p) => acc + (p.total_contract_pyg || 0), 0);

  const totalCobrado = milestones.reduce((acc, m) => acc + (m.paid_amount_pyg || 0), 0);
  const totalPendienteCobro = milestones.reduce((acc, m) => acc + (m.amount_pyg - (m.paid_amount_pyg || 0)), 0);
  const totalGastos = expenses.reduce((acc, e) => acc + (e.amount_pyg || 0), 0);
  const balanceNeto = totalCobrado - totalGastos;

  const handleOpenCobro = (m: ProjectPaymentMilestone) => {
    setCobroModalMilestone(m);
    setCobroMonto(m.amount_pyg - (m.paid_amount_pyg || 0));
    setCobroRecibo('');
  };

  const handleConfirmCobro = () => {
    if (!cobroModalMilestone) return;

    const nuevoPagado = (cobroModalMilestone.paid_amount_pyg || 0) + cobroMonto;
    const isTotal = nuevoPagado >= cobroModalMilestone.amount_pyg;

    const updated: ProjectPaymentMilestone = {
      ...cobroModalMilestone,
      paid_amount_pyg: nuevoPagado,
      status: isTotal ? 'cobrado' : 'parcial',
      payment_date: new Date().toISOString().split('T')[0],
      reference_receipt: cobroRecibo || 'Recibo Oficial S/N',
    };

    StorageService.savePaymentMilestone(updated);
    setCobroModalMilestone(null);
    loadData();
  };

  const handleGuardarGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGasto.concept || nuevoGasto.amount_pyg <= 0) {
      alert('Por favor complete el concepto y un monto válido.');
      return;
    }

    const exp: ProjectExpense = {
      id: 'exp-' + Date.now(),
      project_id: nuevoGasto.projectId || projects[0]?.id || 'proy-001',
      date: new Date().toISOString().split('T')[0],
      concept: nuevoGasto.concept,
      category: nuevoGasto.category,
      amount_pyg: nuevoGasto.amount_pyg,
      provider_or_recipient: nuevoGasto.provider_or_recipient || 'Varios',
      receipt_number: nuevoGasto.receipt_number || 'S/C',
    };

    StorageService.saveProjectExpense(exp);
    setShowGastoModal(false);
    setNuevoGasto({
      projectId: projects[0]?.id || '',
      concept: '',
      category: 'material_adicional',
      amount_pyg: 0,
      provider_or_recipient: '',
      receipt_number: '',
    });
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Cabecera y Selector de Proyecto */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-emerald-600" />
              Gestión Financiera de Obras y Cobranzas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Control de hitos de cobro (anticipos 30%, avances 40%, saldo 30%), recibos y gastos operativos en Paraguay.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrar por Obra:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todas las obras / proyectos activos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowGastoModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar Gasto de Obra
            </button>
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Contratado</span>
            <span className="text-xl font-bold text-slate-900 mt-2 block">{formatGs(totalContratado)}</span>
            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-500" /> Monto de contratos
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Total Cobrado</span>
            <span className="text-xl font-bold text-emerald-700 mt-2 block">{formatGs(totalCobrado)}</span>
            <span className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cobranzas efectivas
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Pendiente de Cobro</span>
            <span className="text-xl font-bold text-amber-700 mt-2 block">{formatGs(totalPendienteCobro)}</span>
            <span className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Hitos por percibir
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Gastos Operativos</span>
            <span className="text-xl font-bold text-rose-700 mt-2 block">{formatGs(totalGastos)}</span>
            <span className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Comprobantes registrados
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Balance de Caja</span>
            <span className={`text-xl font-bold mt-2 block ${balanceNeto >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatGs(balanceNeto)}
            </span>
            <span className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Cobrado menos gastos
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('hitos')}
            className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'hitos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Hitos y Cronograma de Cobros ({milestones.length})
          </button>
          <button
            onClick={() => setActiveTab('gastos')}
            className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'gastos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Gastos y Desembolsos de Obra ({expenses.length})
          </button>
        </div>

        {/* Vista: Hitos de Cobro */}
        {activeTab === 'hitos' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Hitos Contractuales por Cobrar
              </h2>
              <span className="text-xs text-slate-500">
                Estructura habitual: Anticipo 30% / Montaje 40% / Comisionamiento 30%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Descripción del Hito</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4 text-right">Monto Hito</th>
                    <th className="py-3 px-4 text-right">Cobrado</th>
                    <th className="py-3 px-4 text-right">Saldo</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4">Comprobante / Recibo</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {milestones.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No hay hitos de cobro registrados para la selección.
                      </td>
                    </tr>
                  ) : (
                    milestones.map((m) => {
                      const saldo = m.amount_pyg - (m.paid_amount_pyg || 0);
                      const isCobrado = m.status === 'cobrado';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {m.description}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs">
                            {m.due_date}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatGs(m.amount_pyg)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                            {formatGs(m.paid_amount_pyg || 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-amber-700 font-semibold">
                            {formatGs(saldo)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isCobrado
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.status === 'parcial'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isCobrado ? 'Cobrado' : m.status === 'parcial' ? 'Cobro Parcial' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {m.reference_receipt ? (
                              <span className="flex items-center gap-1 font-mono text-slate-700">
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                {m.reference_receipt}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Sin recibo emitido</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isCobrado ? (
                              <button
                                onClick={() => handleOpenCobro(m)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                              >
                                Cobrar
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Pagado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vista: Gastos de Obra */}
        {activeTab === 'gastos' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Desembolsos y Comprobantes de Obra
              </h2>
              <button
                onClick={() => setShowGastoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo Gasto
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Concepto del Desembolso</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Proveedor / Beneficiario</th>
                    <th className="py-3 px-4">N° Factura / Comprobante</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No hay gastos registrados para la selección.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => {
                      const getCatBadge = (cat: string) => {
                        switch (cat) {
                          case 'material_adicional':
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                <Package className="w-3 h-3" /> Material Extra
                              </span>
                            );
                          case 'transporte':
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                                <Truck className="w-3 h-3" /> Flete / Grúa
                              </span>
                            );
                          case 'viaticos':
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200">
                                <Coffee className="w-3 h-3" /> Viáticos
                              </span>
                            );
                          default:
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                <Receipt className="w-3 h-3" /> Varios
                              </span>
                            );
                        }
                      };

                      return (
                        <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-xs text-slate-600">{e.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{e.concept}</td>
                          <td className="py-3 px-4">{getCatBadge(e.category)}</td>
                          <td className="py-3 px-4 text-slate-700">{e.provider_or_recipient}</td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">{e.receipt_number || '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-700">
                            {formatGs(e.amount_pyg)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Registrar Cobro */}
        {cobroModalMilestone && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Registrar Cobro de Hito
                </h3>
                <button
                  onClick={() => setCobroModalMilestone(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Hito:</p>
                <p className="text-sm font-bold text-slate-800">{cobroModalMilestone.description}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Monto total del hito: <strong>{formatGs(cobroModalMilestone.amount_pyg)}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto a Cobrar (Gs.):
                  </label>
                  <input
                    type="number"
                    value={cobroMonto}
                    onChange={(e) => setCobroMonto(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° de Recibo Oficial / Transf. SIPAP:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Recibo 001-002-000450 o Transf. Itaú 98213"
                    value={cobroRecibo}
                    onChange={(e) => setCobroRecibo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCobroModalMilestone(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCobro}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm"
                >
                  Confirmar Cobranza
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Registrar Nuevo Gasto */}
        {showGastoModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  Registrar Gasto de Obra
                </h3>
                <button
                  onClick={() => setShowGastoModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGuardarGasto} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proyecto Asignado:</label>
                  <select
                    value={nuevoGasto.projectId}
                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Concepto del Gasto:</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Compra de 5 disyuntores bipolares por reposición"
                    value={nuevoGasto.concept}
                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, concept: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría:</label>
                    <select
                      value={nuevoGasto.category}
                      onChange={(e: any) => setNuevoGasto({ ...nuevoGasto, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none"
                    >
                      <option value="material_adicional">Material Adicional</option>
                      <option value="transporte">Flete / Grúa / Transporte</option>
                      <option value="viaticos">Viáticos y Almuerzos</option>
                      <option value="imprevisto">Imprevisto Técnico</option>
                      <option value="subcontrato">Subcontrato Externo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monto (Gs.):</label>
                    <input
                      type="number"
                      required
                      value={nuevoGasto.amount_pyg}
                      onChange={(e) => setNuevoGasto({ ...nuevoGasto, amount_pyg: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Proveedor / Beneficiario:</label>
                    <input
                      type="text"
                      placeholder="ej. Enerluz S.A. o Ramón Fleitas"
                      value={nuevoGasto.provider_or_recipient}
                      onChange={(e) => setNuevoGasto({ ...nuevoGasto, provider_or_recipient: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">N° Comprobante:</label>
                    <input
                      type="text"
                      placeholder="ej. Factura 001-002-1249"
                      value={nuevoGasto.receipt_number}
                      onChange={(e) => setNuevoGasto({ ...nuevoGasto, receipt_number: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowGastoModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm"
                  >
                    Guardar Gasto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

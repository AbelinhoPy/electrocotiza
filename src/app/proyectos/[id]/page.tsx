'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Briefcase, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  User, 
  Plus, 
  FileText, 
  ShieldAlert, 
  TrendingUp, 
  Truck, 
  Clock, 
  DollarSign, 
  Save 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Project, ProjectMaterial, ScopeChange, ProjectStatus } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

export default function ProyectoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'materiales' | 'avance' | 'cambios' | 'ordenes'>('materiales');
  
  // Modal de Ampliación de Alcance
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [newScopeDesc, setNewScopeDesc] = useState('');
  const [newScopeAmount, setNewScopeAmount] = useState(0);

  useEffect(() => {
    if (projectId) {
      const p = StorageService.getProjectById(projectId);
      if (p) {
        setProject(p);
      }
    }
  }, [projectId]);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-700">Proyecto no encontrado</h2>
        <Link href="/proyectos" className="text-xs text-blue-600 hover:underline">Volver a Proyectos</Link>
      </div>
    );
  }

  const handleUpdateMaterial = (matId: string, deltaReceived: number, deltaInstalled: number) => {
    StorageService.updateProjectMaterialStatus(project.id, matId, deltaReceived, deltaInstalled);
    const updated = StorageService.getProjectById(project.id);
    if (updated) setProject(updated);
  };

  const handleUpdateProgress = (newProgress: number) => {
    const updated = { ...project, progress_pct: newProgress };
    if (newProgress === 100) {
      updated.status = 'finalizado';
      updated.actual_end_date = new Date().toISOString().split('T')[0];
    } else if (newProgress > 0 && updated.status === 'planificacion') {
      updated.status = 'en_ejecucion';
    }
    StorageService.saveProject(updated);
    setProject(updated);
  };

  const handleAddScopeChange = () => {
    if (!newScopeDesc.trim()) return;
    const newChange: ScopeChange = {
      id: `sc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: newScopeDesc.trim(),
      additional_amount_pyg: newScopeAmount,
      approved_by: StorageService.getCurrentUser()?.full_name || 'Admin',
    };

    const updated = {
      ...project,
      total_contract_pyg: project.total_contract_pyg + newScopeAmount,
      scope_changes: [...(project.scope_changes || []), newChange],
    };
    StorageService.saveProject(updated);
    setProject(updated);
    setShowScopeModal(false);
    setNewScopeDesc('');
    setNewScopeAmount(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* BARRA SUPERIOR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href="/proyectos" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                {project.code}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Origen: <strong className="text-slate-800">{project.quote_number}</strong>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {project.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowScopeModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-blue-700" />
            <span>Adicional de Obra</span>
          </button>
        </div>
      </div>

      {/* TARJETAS RESUMEN DE PROYECTO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">Cliente</span>
          <span className="font-bold text-slate-900 text-sm block truncate">{project.client.name}</span>
          <span className="text-[10px] text-slate-500 font-mono">{project.client.ruc_or_ci || 'S/ RUC'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">Monto Contratado</span>
          <span className="font-bold font-mono text-blue-900 text-sm block">{formatPYG(project.total_contract_pyg)}</span>
          <span className="text-[10px] text-slate-500">{project.scope_changes?.length || 0} ampliaciones</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">Avance de Obra</span>
          <span className="font-bold text-emerald-700 text-sm block">{project.progress_pct}%</span>
          <span className="text-[10px] text-slate-500">Estado: {project.status}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-400 font-bold block">Responsable de Obra</span>
          <span className="font-bold text-slate-900 text-sm block truncate">{project.manager_name}</span>
          <span className="text-[10px] text-slate-500">Inicio: {formatDatePY(project.start_date)}</span>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN INTERNA */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('materiales')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'materiales' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Control de Materiales ({project.materials?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('avance')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'avance' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Avance y Cronograma</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cambios')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'cambios' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Cambios de Alcance ({project.scope_changes?.length || 0})</span>
        </button>
      </div>

      {/* PESTAÑA 1: CONTROL DE MATERIALES REQUERIDOS VS RECIBIDOS VS INSTALADOS */}
      {activeTab === 'materiales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Lista de Materiales Comprometidos en Presupuesto
            </h3>
            <span className="text-xs text-slate-500">
              Registra recepciones y consumos de materiales sin alterar el compromiso original.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Descripción del Material</th>
                  <th className="py-2.5 px-2 w-16 text-center">Unidad</th>
                  <th className="py-2.5 px-2 w-24 text-right">Requerido</th>
                  <th className="py-2.5 px-2 w-24 text-right">Recibido en Obra</th>
                  <th className="py-2.5 px-2 w-24 text-right">Instalado</th>
                  <th className="py-2.5 px-2 w-24 text-right">Pendiente</th>
                  <th className="py-2.5 px-3 w-40 text-center">Acciones Recepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(project.materials || []).map((mat) => {
                  const isComplete = (mat.quantity_pending || 0) <= 0;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{mat.description}</span>
                        {mat.notes && <span className="text-[10px] text-slate-400 block">{mat.notes}</span>}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600 font-semibold">{mat.unit}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">{mat.quantity_required}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-blue-700">{mat.quantity_received || 0}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{mat.quantity_installed || 0}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-amber-700">
                        {mat.quantity_pending || 0}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateMaterial(mat.id, 1, 0)}
                            title="Recibir +1 unidad"
                            className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                          >
                            +1 Recibir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateMaterial(mat.id, mat.quantity_pending || 0, 0)}
                            title="Recibir todo lo pendiente"
                            className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded"
                          >
                            Recibir Todo
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: AVANCE DE OBRA */}
      {activeTab === 'avance' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Control de Porcentaje de Avance General</h3>
            <p className="text-xs text-slate-500 mt-0.5">Desliza para actualizar el porcentaje de avance físico del proyecto.</p>

            <div className="flex items-center space-x-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={project.progress_pct}
                onChange={e => handleUpdateProgress(Number(e.target.value))}
                className="flex-1 h-3 bg-slate-200 rounded-lg cursor-pointer accent-blue-700"
              />
              <span className="font-mono font-black text-2xl text-blue-900 w-16 text-right">
                {project.progress_pct}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Fases del Cronograma:</h4>
            {(project.tasks || []).map((t, i) => (
              <div key={t.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{t.title}</span>
                  <span className="text-[11px] text-slate-500">
                    Responsable: {t.assigned_to} • {t.estimated_hours}h estimadas
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-800">{t.progress_pct}%</span>
                  <span className="text-[10px] text-slate-400 block">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CAMBIOS DE ALCANCE (AMPLIACIONES DE OBRA) */}
      {activeTab === 'cambios' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Registro Histórico de Cambios de Alcance
            </h3>
            <button
              type="button"
              onClick={() => setShowScopeModal(true)}
              className="px-3 py-1.5 text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 rounded-lg shadow-sm"
            >
              + Agregar Ampliación
            </button>
          </div>

          {(project.scope_changes || []).length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No hay ampliaciones de alcance registradas.</p>
          ) : (
            <div className="space-y-3">
              {project.scope_changes.map((sc) => (
                <div key={sc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono text-slate-400 text-[10px] block">{formatDatePY(sc.date)}</span>
                    <span className="font-bold text-slate-900 text-sm block">{sc.description}</span>
                    <span className="text-slate-500 text-[11px]">Aprobado por: {sc.approved_by}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Monto Adicional</span>
                    <span className="font-mono font-black text-emerald-700 text-base">+{formatPYG(sc.additional_amount_pyg)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL ADICIONAL DE OBRA */}
      {showScopeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Registrar Ampliación de Alcance / Adicional</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción del Trabajo Adicional *</label>
                <textarea
                  rows={3}
                  value={newScopeDesc}
                  onChange={e => setNewScopeDesc(e.target.value)}
                  placeholder="Ej: Instalación de 2 circuitos trifásicos adicionales para compresor nuevo..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monto Adicional Contratado (Gs.) *</label>
                <input
                  type="number"
                  value={newScopeAmount}
                  onChange={e => setNewScopeAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 font-bold font-mono border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddScopeChange}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Guardar Ampliación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

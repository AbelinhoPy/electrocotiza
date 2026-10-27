'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Project, ProjectStatus } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

const STATUS_MAP: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
  planificacion: { label: 'Planificación', bg: 'bg-slate-100', text: 'text-slate-800' },
  en_ejecucion: { label: 'En Ejecución', bg: 'bg-blue-100', text: 'text-blue-800' },
  en_pruebas: { label: 'En Pruebas / Comisionamiento', bg: 'bg-amber-100', text: 'text-amber-800' },
  finalizado: { label: 'Finalizado y Entregado', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  suspendido: { label: 'Suspendido', bg: 'bg-red-100', text: 'text-red-800' },
};

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    setProjects(StorageService.getProjects());
  }, []);

  const filteredProjects = projects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.client.name.toLowerCase().includes(q) ||
        p.manager_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-amber-400" />
            </div>
            <span>Gestión y Seguimiento de Proyectos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Proyectos convertidos desde presupuestos aprobados • Control de materiales requeridos vs recibidos vs instalados.
          </p>
        </div>

        <Link
          href="/presupuestos"
          className="px-4 py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold rounded-xl border border-blue-200 flex items-center space-x-1.5"
        >
          <span>Ver Presupuestos para Convertir</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, obra, cliente o responsable..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Todos los Estados</option>
            <option value="planificacion">Planificación</option>
            <option value="en_ejecucion">En Ejecución</option>
            <option value="en_pruebas">En Pruebas</option>
            <option value="finalizado">Finalizado</option>
            <option value="suspendido">Suspendido</option>
          </select>
        </div>
      </div>

      {/* GRILLA DE PROYECTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => {
          const statusConfig = STATUS_MAP[p.status] || STATUS_MAP.planificacion;
          const totalMaterials = p.materials?.length || 0;
          const pendingMaterials = p.materials?.filter(m => (m.quantity_pending || 0) > 0).length || 0;

          return (
            <Link
              key={p.id}
              href={`/proyectos/${p.id}`}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded border border-blue-200">
                    {p.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Cliente: <strong>{p.client.name}</strong>
                  </p>
                </div>

                {/* BARRA DE AVANCE */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Avance de Obra</span>
                    <span className="font-bold text-slate-900">{p.progress_pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-700 rounded-full transition-all"
                      style={{ width: `${p.progress_pct}%` }}
                    />
                  </div>
                </div>

                {/* MÉTRICAS OPERATIVAS */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contrato Total</span>
                    <span className="font-mono font-bold text-slate-800">{formatPYG(p.total_contract_pyg)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Responsable</span>
                    <span className="font-semibold text-slate-700 truncate block">{p.manager_name}</span>
                  </div>
                </div>

                {/* ESTADO DE MATERIALES */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-blue-700" />
                    <span>Materiales en Obra</span>
                  </span>
                  <span className={`font-bold ${pendingMaterials > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {pendingMaterials > 0 ? `${pendingMaterials} pendientes` : '100% recibidos'}
                  </span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Ref: {p.quote_number}</span>
                <span className="text-blue-600 font-bold flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Ver Proyecto</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}

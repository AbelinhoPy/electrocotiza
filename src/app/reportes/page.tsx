'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileSpreadsheet, 
  DollarSign, 
  Briefcase, 
  Layers 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, Project, InventoryStock, InventoryMovement } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

export default function ReportesPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [permissions, setPermissions] = useState(StorageService.getUserPermissions(null));

  useEffect(() => {
    setBudgets(StorageService.getBudgets());
    setProjects(StorageService.getProjects());
    setStocks(StorageService.getStocks());
    setPermissions(StorageService.getUserPermissions(StorageService.getCurrentUser()));
  }, []);

  // --- CÁLCULO DE KPIS REALES ---
  const totalPresupuestos = budgets.length;
  const presupuestosAprobados = budgets.filter(b => b.status === 'accepted').length;
  const presupuestosRechazados = budgets.filter(b => b.status === 'rejected').length;
  const presupuestosEnviados = budgets.filter(b => b.status === 'sent').length;
  const presupuestosBorrador = budgets.filter(b => b.status === 'draft').length;

  // Tasa de aprobación oficial: Aprobados / (Aprobados + Rechazados) * 100
  const decididos = presupuestosAprobados + presupuestosRechazados;
  const tasaAprobacion = decididos > 0 
    ? Number(((presupuestosAprobados / decididos) * 100).toFixed(1))
    : 100;

  const montoTotalPresupuestado = budgets.reduce((acc, b) => acc + (b.total_sale_pyg || 0), 0);
  const montoTotalAprobado = budgets
    .filter(b => b.status === 'accepted')
    .reduce((acc, b) => acc + (b.total_sale_pyg || 0), 0);

  const totalProyectosActivos = projects.filter(p => p.status === 'en_ejecucion' || p.status === 'en_pruebas').length;

  // Exportar Reporte a CSV
  const handleExportCSV = (tipo: 'presupuestos' | 'proyectos' | 'inventario') => {
    let headers = '';
    let rows = '';
    let filename = '';

    if (tipo === 'presupuestos') {
      headers = 'Numero,Titulo,Cliente,RUC,Fecha,Estado,Subtotal_PYG,IVA_10_PYG,Total_PYG\n';
      rows = budgets.map(b => 
        `"${b.budget_number}","${b.title}","${b.client.name}","${b.client.ruc_or_ci}","${b.created_at.split('T')[0]}","${b.status}",${b.subtotal_net_pyg || b.total_sale_pyg},${b.iva_amount_pyg || 0},${b.total_sale_pyg}`
      ).join('\n');
      filename = `Reporte_Presupuestos_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (tipo === 'proyectos') {
      headers = 'Codigo,Nombre,Cliente,Responsable,Estado,Avance_Pct,Contrato_PYG\n';
      rows = projects.map(p => 
        `"${p.code}","${p.name}","${p.client.name}","${p.manager_name}","${p.status}",${p.progress_pct},${p.total_contract_pyg}`
      ).join('\n');
      filename = `Reporte_Proyectos_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (tipo === 'inventario') {
      headers = 'Material_ID,Almacen_ID,Stock_Fisico,Stock_Reservado,Stock_Disponible\n';
      rows = stocks.map(s => 
        `"${s.material_id}","${s.warehouse_id}",${s.physical_stock},${s.reserved_stock},${s.available_stock}`
      ).join('\n');
      filename = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <span>Reportes e Indicadores Operativos (KPIs)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas reales de conversión comercial, volumen presupuestado y exportación de datos en formato CSV.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleExportCSV('presupuestos')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV Presupuestos</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE KPIS PRINCIPALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Tasa de Aprobación Comercial</span>
          <div className="text-3xl font-black text-emerald-700 font-mono">
            {tasaAprobacion}%
          </div>
          <span className="text-[11px] text-slate-400 block">
            Fórmula: {presupuestosAprobados} aprobados / {decididos || 1} decididos
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Monto Total Aprobado</span>
          <div className="text-xl font-black text-blue-900 font-mono truncate">
            {formatPYG(montoTotalAprobado)}
          </div>
          <span className="text-[11px] text-slate-400 block">
            De {formatPYG(montoTotalPresupuestado)} cotizados
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Proyectos Activos en Ejecución</span>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {totalProyectosActivos}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Total {projects.length} proyectos registrados
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Presupuestos por Estado</span>
          <div className="flex items-center space-x-2 pt-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
              {presupuestosEnviados} env
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
              {presupuestosAprobados} apr
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
              {presupuestosBorrador} bor
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">Total {totalPresupuestos} registrados</span>
        </div>
      </div>

      {/* EXPORTACIÓN DE REPORTES ESPECÍFICOS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Descarga Directa de Planillas CSV / Excel:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Libro de Presupuestos</h3>
              <p className="text-xs text-slate-500 mt-1">
                Incluye números correlativos, clientes, RUC, subtotales netos, liquidación de IVA 10% y totales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCSV('presupuestos')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs border border-slate-300 rounded-lg flex items-center justify-center space-x-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Descargar CSV Presupuestos</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Control de Proyectos y Obras</h3>
              <p className="text-xs text-slate-500 mt-1">
                Códigos de obra, responsables, estado operativo, avance físico y montos de contrato.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCSV('proyectos')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs border border-slate-300 rounded-lg flex items-center justify-center space-x-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Descargar CSV Proyectos</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Existencias de Inventario</h3>
              <p className="text-xs text-slate-500 mt-1">
                Materiales en almacén, existencias físicas, stock reservado y balance disponible.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCSV('inventario')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs border border-slate-300 rounded-lg flex items-center justify-center space-x-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Descargar CSV Inventario</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Download, 
  FileText 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { ServiceOrder, ServiceOrderStatus } from '@/lib/types';
import { formatDatePY } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_MAP: Record<ServiceOrderStatus, { label: string; bg: string; text: string }> = {
  pendiente: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-800' },
  en_proceso: { label: 'En Proceso', bg: 'bg-blue-100', text: 'text-blue-800' },
  completada: { label: 'Completada', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelada: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-800' },
};

export default function OrdenesServicioPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Campos nueva orden
  const [newClientName, setNewClientName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newTechnician, setNewTechnician] = useState('Ramón Fleitas');
  const [newDescription, setNewDescription] = useState('');
  const [newEstimatedHours, setNewEstimatedHours] = useState(4);

  const loadData = () => {
    setOrders(StorageService.getServiceOrders());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = () => {
    if (!newClientName.trim() || !newDescription.trim()) {
      alert('Ingresa el cliente y la descripción de la orden.');
      return;
    }

    const allOrders = StorageService.getServiceOrders();
    const count = allOrders.length + 1;
    const orderNumber = `OS-2026-${String(count).padStart(4, '0')}`;

    const newOrder: ServiceOrder = {
      id: `os-${Date.now()}`,
      order_number: orderNumber,
      client_id: `cli-${Date.now()}`,
      client_name: newClientName.trim(),
      project_name: newProjectName.trim() || undefined,
      assigned_technician: newTechnician.trim(),
      date: new Date().toISOString().split('T')[0],
      work_description: newDescription.trim(),
      estimated_hours: newEstimatedHours,
      materials_planned: [],
      materials_used: [],
      status: 'pendiente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    StorageService.saveServiceOrder(newOrder);
    loadData();
    setShowNewOrderModal(false);
    setNewClientName('');
    setNewProjectName('');
    setNewDescription('');
    alert(`Orden de Servicio ${orderNumber} creada con éxito.`);
  };

  const handleDownloadPDF = (order: ServiceOrder) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const settings = StorageService.getSettings();

    doc.setFillColor(15, 33, 55);
    doc.rect(10, 10, 190, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(251, 191, 36);
    doc.text('ORDEN DE SERVICIO TÉCNICO', 15, 20);

    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.company_name} | RUC: ${settings.ruc}`, 15, 28);

    doc.setFont('helvetica', 'bold');
    doc.text(order.order_number, 195, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${formatDatePY(order.date)}`, 195, 28, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Cliente: ${order.client_name}`, 15, 45);
    if (order.project_name) doc.text(`Proyecto: ${order.project_name}`, 15, 52);
    doc.text(`Técnico Asignado: ${order.assigned_technician}`, 15, 59);
    doc.text(`Horas Estimadas: ${order.estimated_hours}h`, 140, 59);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Descripción del Trabajo a Realizar:', 15, 70);
    doc.setFont('helvetica', 'italic');
    doc.text(order.work_description, 15, 76, { maxWidth: 180 });

    const applyAT = (autoTable as any)?.default || autoTable || (doc as any).autoTable;
    applyAT(doc, {
      startY: 95,
      head: [['#', 'MATERIALES UTILIZADOS EN INTERVENCIÓN', 'CANTIDAD', 'UNIDAD']],
      body: (order.materials_used || []).map((m, i) => [
        (i + 1).toString(),
        m.description,
        m.quantity.toString(),
        m.unit
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 33, 55], textColor: [255, 255, 255] },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 130;
    doc.setDrawColor(148, 163, 184);
    doc.line(20, finalY + 40, 80, finalY + 40);
    doc.line(130, finalY + 40, 190, finalY + 40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Firma Técnico de Obra', 50, finalY + 45, { align: 'center' });
    doc.text('Conforme del Cliente / Supervisor', 160, finalY + 45, { align: 'center' });

    doc.save(`Orden_Servicio_${order.order_number}.pdf`);
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.client_name.toLowerCase().includes(q) ||
        o.assigned_technician.toLowerCase().includes(q) ||
        o.work_description.toLowerCase().includes(q)
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
              <Wrench className="w-4 h-4 text-amber-400" />
            </div>
            <span>Órdenes de Servicio Técnico (OS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Asignación de trabajos en obra • Registro de horas y materiales utilizados • Comprobante PDF oficial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewOrderModal(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Nueva Orden de Servicio</span>
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por número, cliente, técnico o trabajo..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
        >
          <option value="all">Todos los Estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* TABLA DE ÓRDENES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0F2137] text-white font-bold">
              <tr>
                <th className="py-3 px-3 w-32">Nº Orden</th>
                <th className="py-3 px-3">Cliente / Obra</th>
                <th className="py-3 px-3">Descripción de la Tarea</th>
                <th className="py-3 px-3 w-36">Técnico Asignado</th>
                <th className="py-3 px-2 w-24 text-center">Fecha</th>
                <th className="py-3 px-2 w-20 text-center">Horas</th>
                <th className="py-3 px-3 w-28 text-center">Estado</th>
                <th className="py-3 px-3 w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((o) => {
                const statusConfig = STATUS_MAP[o.status] || STATUS_MAP.pendiente;

                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">{o.order_number}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{o.client_name}</span>
                      {o.project_name && <span className="text-[10px] text-slate-400 block">{o.project_name}</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <span className="line-clamp-2">{o.work_description}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-semibold">{o.assigned_technician}</td>
                    <td className="py-3 px-2 text-center text-slate-500">{formatDatePY(o.date)}</td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">{o.estimated_hours}h</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(o)}
                        title="Descargar Orden en PDF"
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-[11px] font-bold">PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVA ORDEN */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-blue-700" />
              <span>Emitir Orden de Servicio Técnico</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cliente *</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Ej: Frigorífico Chortitzer"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proyecto / Obra (Opcional)</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Ej: Montaje Tableros CCM Planta Mariano"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Técnico Asignado *</label>
                <input
                  type="text"
                  value={newTechnician}
                  onChange={e => setNewTechnician(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Horas Estimadas</label>
                <input
                  type="number"
                  value={newEstimatedHours}
                  onChange={e => setNewEstimatedHours(Number(e.target.value))}
                  className="w-full px-3 py-1.5 font-bold font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción del Trabajo *</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Detalla los trabajos de mantenimiento, cableado o montaje a realizar..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewOrderModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateOrder}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Emitir Orden
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

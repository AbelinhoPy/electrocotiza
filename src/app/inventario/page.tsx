'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Warehouse as WarehouseIcon, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldAlert 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Warehouse, InventoryStock, InventoryMovement, CanonicalProduct } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

export default function InventarioPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);

  // Filtros
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'existencias' | 'movimientos'>('existencias');

  // Modal Nuevo Movimiento
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movType, setMovType] = useState<any>('entrada');
  const [movMaterialId, setMovMaterialId] = useState('');
  const [movQuantity, setMovQuantity] = useState(1);
  const [movReason, setMovReason] = useState('');
  const [movDocRef, setMovDocRef] = useState('');
  const [movTargetWh, setMovTargetWh] = useState('');

  const loadData = () => {
    setWarehouses(StorageService.getWarehouses());
    setStocks(StorageService.getStocks());
    setMovements(StorageService.getMovements());
    const prods = StorageService.getProducts();
    setProducts(prods);
    if (prods.length > 0 && !movMaterialId) {
      setMovMaterialId(prods[0].id);
    }
    const whs = StorageService.getWarehouses();
    if (whs.length > 0 && !movTargetWh) {
      setMovTargetWh(whs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordMovement = () => {
    if (movQuantity <= 0) {
      alert('La cantidad debe ser mayor a cero.');
      return;
    }
    if (!movReason.trim()) {
      alert('Ingresa el motivo del movimiento.');
      return;
    }

    const prod = products.find(p => p.id === movMaterialId);

    StorageService.recordInventoryMovement({
      movement_type: movType,
      material_id: movMaterialId,
      material_name: prod?.name || 'Material Eléctrico',
      target_warehouse_id: movTargetWh,
      source_warehouse_id: movTargetWh,
      quantity: movQuantity,
      unit: prod?.unit || 'un',
      reason: movReason.trim(),
      reference_document: movDocRef.trim() || 'Ajuste manual',
      user_name: StorageService.getCurrentUser()?.full_name || 'Operador',
    });

    loadData();
    setShowMovementModal(false);
    setMovReason('');
    setMovDocRef('');
    setMovQuantity(1);
    alert('Movimiento de inventario registrado con éxito.');
  };

  // Filtrado de stocks
  const filteredStocks = stocks.filter(stk => {
    if (selectedWarehouseId !== 'all' && stk.warehouse_id !== selectedWarehouseId) return false;
    const prod = products.find(p => p.id === stk.material_id);
    if (searchQuery.trim() && prod) {
      const q = searchQuery.toLowerCase();
      return prod.name.toLowerCase().includes(q) || prod.sku.toLowerCase().includes(q);
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
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <span>Inventario y Existencias por Almacén</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de Stock Físico, Reservado por Proyectos y Disponible • Trazabilidad estricta de movimientos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMovementModal(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Registrar Movimiento</span>
        </button>
      </div>

      {/* FILTROS Y SELECTOR DE ALMACÉN */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <WarehouseIcon className="w-4 h-4 text-slate-400" />
          <select
            value={selectedWarehouseId}
            onChange={e => setSelectedWarehouseId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
          >
            <option value="all">Todos los Almacenes</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar material o SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* PESTAÑAS EXISTENCIAS / MOVIMIENTOS */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('existencias')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'existencias' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Existencias Actuales ({filteredStocks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movimientos')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'movimientos' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial de Movimientos ({movements.length})</span>
        </button>
      </div>

      {/* TABLA DE EXISTENCIAS */}
      {activeTab === 'existencias' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F2137] text-white font-bold">
                <tr>
                  <th className="py-3 px-3">Material / Código</th>
                  <th className="py-3 px-3">Almacén</th>
                  <th className="py-3 px-2 w-16 text-center">Unidad</th>
                  <th className="py-3 px-3 w-28 text-right">Stock Físico</th>
                  <th className="py-3 px-3 w-28 text-right">Reservado Proyecto</th>
                  <th className="py-3 px-3 w-32 text-right">Stock Disponible</th>
                  <th className="py-3 px-3 w-28 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStocks.map((stk) => {
                  const prod = products.find(p => p.id === stk.material_id);
                  const wh = warehouses.find(w => w.id === stk.warehouse_id);
                  const isLow = stk.available_stock <= stk.min_alert_stock;

                  return (
                    <tr key={stk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{prod?.name || 'Material Eléctrico'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {prod?.sku || stk.material_id}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {wh?.name || 'Almacén Central'}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600 font-semibold">{prod?.unit || 'un'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{stk.physical_stock}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">{stk.reserved_stock}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-blue-900 text-sm">
                        {stk.available_stock}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Stock Bajo' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLA DE HISTORIAL DE MOVIMIENTOS */}
      {activeTab === 'movimientos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F2137] text-white font-bold">
                <tr>
                  <th className="py-3 px-3 w-32">Nº Movimiento</th>
                  <th className="py-3 px-3 w-28 text-center">Tipo</th>
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-2 w-20 text-right">Cantidad</th>
                  <th className="py-3 px-3">Motivo / Documento Referencia</th>
                  <th className="py-3 px-3 w-32">Usuario</th>
                  <th className="py-3 px-2 w-24 text-center">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">{mov.movement_number}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        mov.movement_type === 'entrada' ? 'bg-emerald-100 text-emerald-800' :
                        mov.movement_type === 'salida' ? 'bg-red-100 text-red-800' :
                        mov.movement_type === 'reserva_proyecto' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {mov.movement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{mov.material_name}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">
                      {mov.quantity} {mov.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span>{mov.reason}</span>
                      {mov.reference_document && (
                        <span className="block text-[10px] text-slate-400 font-mono">Ref: {mov.reference_document}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{mov.user_name}</td>
                    <td className="py-3 px-2 text-center text-slate-500">{formatDatePY(mov.created_at.split('T')[0])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR MOVIMIENTO */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-700" />
              <span>Registrar Movimiento de Inventario</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Movimiento *</label>
                <select
                  value={movType}
                  onChange={e => setMovType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="entrada">Entrada (Compra / Recepción Proveedor)</option>
                  <option value="salida">Salida (Consumo Obra / Despacho)</option>
                  <option value="reserva_proyecto">Reserva para Proyecto</option>
                  <option value="liberacion_reserva">Liberación de Reserva</option>
                  <option value="ajuste_positivo">Ajuste de Conteo (+)</option>
                  <option value="ajuste_negativo">Ajuste de Merma / Pérdida (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Material *</label>
                <select
                  value={movMaterialId}
                  onChange={e => setMovMaterialId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Almacén Destino / Origen *</label>
                <select
                  value={movTargetWh}
                  onChange={e => setMovTargetWh(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  value={movQuantity}
                  onChange={e => setMovQuantity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 font-bold font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Documento de Referencia</label>
                <input
                  type="text"
                  value={movDocRef}
                  onChange={e => setMovDocRef(e.target.value)}
                  placeholder="Ej: Factura Fixopar #001-001-0040993, Remisión R-12"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Observación *</label>
                <textarea
                  rows={2}
                  value={movReason}
                  onChange={e => setMovReason(e.target.value)}
                  placeholder="Motivo del movimiento..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRecordMovement}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Confirmar Movimiento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

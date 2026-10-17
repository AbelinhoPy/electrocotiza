'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Search, 
  Calculator, 
  Building2, 
  Wrench, 
  UserPlus, 
  FileSpreadsheet, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Budget, BudgetItem, CanonicalProduct, Client, Settings } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';
import { generateClientPDF } from '@/lib/export/pdf-generator';
import { generateInternalExcel } from '@/lib/export/excel-generator';

export default function NuevoPresupuestoPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<Settings>(StorageService.getSettings());
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);

  // Estado del Presupuesto
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [globalMargin, setGlobalMargin] = useState(30);
  const [validityDays, setValidityDays] = useState(15);
  const [deliveryTerms, setDeliveryTerms] = useState('Inmediato / Según avance de obra');
  const [paymentTerms, setPaymentTerms] = useState('A convenir / Contra entrega');
  const [notes, setNotes] = useState('');
  const [priceStrategy, setPriceStrategy] = useState<'last_price' | 'cheapest' | 'weighted_avg'>('last_price');

  // Ítems del presupuesto
  const [items, setItems] = useState<BudgetItem[]>([]);

  // Selector rápido de materiales
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [showItemPicker, setShowItemPicker] = useState(false);

  // Modal para nuevo cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientRuc, setNewClientRuc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('Asunción');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedBudget, setSavedBudget] = useState<Budget | null>(null);

  useEffect(() => {
    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);
    setGlobalMargin(loadedSettings.default_margin_pct || 30);
    setValidityDays(loadedSettings.pdf_validez_dias || 15);
    setDeliveryTerms(loadedSettings.pdf_plazo_entrega_defecto || 'Inmediato / Según avance de obra');
    setPaymentTerms(loadedSettings.pdf_condicion_pago_defecto || 'A convenir / Contra entrega');

    const loadedClients = StorageService.getClients();
    setClients(loadedClients);
    if (loadedClients.length > 0) {
      setSelectedClientId(loadedClients[0].id);
    }

    setProducts(StorageService.getProducts());
  }, []);

  // Materiales sugeridos por búsqueda difusa
  const searchResults = materialSearchQuery.trim()
    ? StorageService.searchProducts(materialSearchQuery, 10).map(r => r.product)
    : products.slice(0, 10);

  // Agregar producto canónico al presupuesto
  const handleAddMaterial = (prod: CanonicalProduct) => {
    // Determinar precio según estrategia elegida
    let cost = prod.last_price_pyg;
    if (priceStrategy === 'cheapest' && prod.min_price_pyg > 0) {
      cost = prod.min_price_pyg;
    }

    const margin = globalMargin;
    // Venta unitaria con margen e IVA incluido
    const unitSale = Math.round(cost * (1 + margin / 100));

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${items.length + 1}`,
      canonical_product_id: prod.id,
      provider_id: prod.history?.[0]?.provider_id,
      provider_name: prod.last_provider_name,
      item_type: 'material',
      description: prod.name,
      quantity: 1,
      unit: prod.unit,
      unit_cost_pyg: cost,
      margin_pct: margin,
      unit_sale_pyg: unitSale,
      total_sale_pyg: unitSale * 1,
      position: items.length + 1,
    };

    setItems([...items, newItem]);
    setMaterialSearchQuery('');
    setShowItemPicker(false);
  };

  // Agregar mano de obra rápida
  const handleAddLabor = (tipo: string, defaultCost: number, unit: string) => {
    const margin = globalMargin;
    const unitSale = Math.round(defaultCost * (1 + margin / 100));

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${items.length + 1}`,
      item_type: 'labor',
      description: `Mano de obra especializada: ${tipo}`,
      quantity: 1,
      unit: unit,
      unit_cost_pyg: defaultCost,
      margin_pct: margin,
      unit_sale_pyg: unitSale,
      total_sale_pyg: unitSale,
      position: items.length + 1,
    };

    setItems([...items, newItem]);
  };

  // Modificar cantidad de un ítem
  const handleQuantityChange = (index: number, newQty: number) => {
    const updated = [...items];
    const item = updated[index];
    const qty = Math.max(0.1, newQty);
    item.quantity = qty;
    item.total_sale_pyg = Math.round(item.unit_sale_pyg * qty);
    setItems(updated);
  };

  // Modificar margen específico de un ítem
  const handleMarginChange = (index: number, newMargin: number) => {
    const updated = [...items];
    const item = updated[index];
    item.margin_pct = newMargin;
    item.unit_sale_pyg = Math.round(item.unit_cost_pyg * (1 + newMargin / 100));
    item.total_sale_pyg = Math.round(item.unit_sale_pyg * item.quantity);
    setItems(updated);
  };

  // Eliminar ítem
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Aplicar margen global a todos los ítems existentes
  const handleApplyGlobalMargin = (margin: number) => {
    setGlobalMargin(margin);
    const updated = items.map(it => {
      const unitSale = Math.round(it.unit_cost_pyg * (1 + margin / 100));
      return {
        ...it,
        margin_pct: margin,
        unit_sale_pyg: unitSale,
        total_sale_pyg: Math.round(unitSale * it.quantity),
      };
    });
    setItems(updated);
  };

  // Totales calculados
  const totalCost = items.reduce((sum, it) => sum + (it.unit_cost_pyg * it.quantity), 0);
  const totalSale = items.reduce((sum, it) => sum + it.total_sale_pyg, 0);
  const totalProfit = totalSale - totalCost;
  const ivaAmount = Math.round(totalSale / 11); // IVA 10% incluido en Guaraníes: Base = Total / 1.1; IVA = Total / 11

  // Guardar Presupuesto
  const handleSaveBudget = () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para la obra o presupuesto.');
      return;
    }
    const client = clients.find(c => c.id === selectedClientId) || clients[0];
    if (!client) {
      alert('Por favor selecciona o crea un cliente.');
      return;
    }
    if (items.length === 0) {
      alert('Debes agregar al menos un ítem al presupuesto.');
      return;
    }

    setIsSaving(true);
    const count = StorageService.getBudgets().length + 1;
    const newBudget: Budget = {
      id: `b-${Date.now()}`,
      budget_number: `COT-2026-${String(count).padStart(3, '0')}`,
      title: title.trim(),
      client,
      status: 'draft',
      global_margin_pct: globalMargin,
      total_cost_pyg: totalCost,
      total_sale_pyg: totalSale,
      iva_amount_pyg: ivaAmount,
      validity_days: validityDays,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      notes: notes.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items,
    };

    StorageService.saveBudget(newBudget);
    setSavedBudget(newBudget);
    setIsSaving(false);
  };

  // Descarga directa del PDF
  const handleDownloadPDF = async () => {
    if (!savedBudget) {
      handleSaveBudget();
    }
    const target = savedBudget || {
      id: 'preview',
      budget_number: 'COT-PREVIA',
      title: title || 'Presupuesto de Obra',
      client: clients.find(c => c.id === selectedClientId) || clients[0],
      status: 'draft' as const,
      global_margin_pct: globalMargin,
      total_cost_pyg: totalCost,
      total_sale_pyg: totalSale,
      iva_amount_pyg: ivaAmount,
      validity_days: validityDays,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items,
    };

    const doc = await generateClientPDF(target, settings);
    doc.save(`Presupuesto_${target.budget_number}_Cliente.pdf`);
  };

  // Descarga del Excel interno
  const handleDownloadExcel = () => {
    const target = savedBudget || {
      id: 'preview',
      budget_number: 'COT-INTERNA',
      title: title || 'Presupuesto de Obra',
      client: clients.find(c => c.id === selectedClientId) || clients[0],
      status: 'draft' as const,
      global_margin_pct: globalMargin,
      total_cost_pyg: totalCost,
      total_sale_pyg: totalSale,
      iva_amount_pyg: ivaAmount,
      validity_days: validityDays,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items,
    };

    generateInternalExcel(target);
  };

  // Crear cliente rápido
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newCli: Client = {
      id: `cli-${Date.now()}`,
      name: newClientName.trim(),
      ruc_or_ci: newClientRuc.trim() || 'S/D',
      phone: newClientPhone.trim() || '-',
      email: '',
      city: newClientCity,
      address: newClientAddress.trim(),
    };

    StorageService.addClient(newCli);
    setClients(StorageService.getClients());
    setSelectedClientId(newCli.id);
    setShowNewClientModal(false);
    setNewClientName('');
    setNewClientRuc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* BARRA SUPERIOR DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/presupuestos"
            className="p-2 rounded-xl bg-[#0F1E33] border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Creador Ágil en Obra</span>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Nuevo Presupuesto Eléctrico
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0F1E33] border border-slate-800 text-slate-300 hover:text-white shadow-sm transition-all"
            title="Excel interno con costos reales y proveedores"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Excel Interno</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-[#070D18] hover:bg-slate-900 text-amber-400 border border-amber-400/40 shadow-md transition-all"
            title="PDF para el cliente con marco dorado y sin costos"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>PDF Dorado</span>
          </button>

          <button
            onClick={handleSaveBudget}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{savedBudget ? 'Guardado ✓' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {savedBudget && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold">
              Presupuesto #{savedBudget.budget_number} guardado con éxito.
            </span>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="text-xs font-black text-amber-400 underline hover:text-amber-300"
          >
            Descargar PDF ahora →
          </button>
        </div>
      )}

      {/* FORMULARIO DE CABECERA: TÍTULO, CLIENTE Y MARGEN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Título de la obra */}
        <div className="bg-[#0F1E33] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl space-y-2.5">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Proyecto / Obra
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Adecuación de Tablero y Cableado Residencia"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex items-center space-x-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Estrategia:</span>
            <select
              value={priceStrategy}
              onChange={(e) => setPriceStrategy(e.target.value as any)}
              className="text-xs bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 font-medium"
            >
              <option value="last_price">Último Precio Pagado</option>
              <option value="cheapest">Precio Más Barato Registrado</option>
            </select>
          </div>
        </div>

        {/* Cliente */}
        <div className="bg-[#0F1E33] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Cliente ("PARA:")
            </label>
            <button
              onClick={() => setShowNewClientModal(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              + Nuevo Cliente
            </button>
          </div>

          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.ruc_or_ci ? `(RUC/CI: ${c.ruc_or_ci})` : ''}
              </option>
            ))}
          </select>

          {clients.find(c => c.id === selectedClientId) && (
            <p className="text-[11px] text-slate-400 truncate">
              {clients.find(c => c.id === selectedClientId)?.address} • Tel: {clients.find(c => c.id === selectedClientId)?.phone}
            </p>
          )}
        </div>

        {/* Margen de Ganancia Global y Condiciones */}
        <div className="bg-[#0F1E33] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Margen de Ganancia Global
            </label>
            <span className="text-xs font-black text-slate-950 bg-amber-400 px-2 py-0.5 rounded-lg">
              {globalMargin}%
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={globalMargin}
              onChange={(e) => handleApplyGlobalMargin(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
            <div>
              Validez: <strong>{validityDays} días</strong>
            </div>
            <div>
              IVA: <strong>10% incluido</strong>
            </div>
          </div>
        </div>

      </div>

      {/* BARRA DE AGREGADO RÁPIDO DE ÍTEMS (MATERIALES Y MANO DE OBRA) */}
      <div className="bg-[#0F2137] text-white p-5 rounded-3xl shadow-lg space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Agregar Ítems al Presupuesto</span>
            </h2>
            <p className="text-xs text-slate-300">
              Selecciona materiales del catálogo con sus precios actualizados o plantillas de mano de obra.
            </p>
          </div>

          {/* Plantillas de Mano de Obra Rápidas */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-amber-300 font-bold shrink-0 mr-1">+ Mano de Obra:</span>
            <button
              onClick={() => handleAddLabor('Montaje y conexión de tablero seccional', 450000, 'gl')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 shrink-0 border border-slate-700"
            >
              Tablero (450.000 ₲)
            </button>
            <button
              onClick={() => handleAddLabor('Tendido de cables y montaje de bocas', 30000, 'boca')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 shrink-0 border border-slate-700"
            >
              Boca (30.000 ₲)
            </button>
            <button
              onClick={() => handleAddLabor('Jornal electricista oficial con ayudante', 350000, 'día')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 shrink-0 border border-slate-700"
            >
              Día Obra (350.000 ₲)
            </button>
          </div>
        </div>

        {/* Buscador de Materiales Inmediato */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={materialSearchQuery}
            onFocus={() => setShowItemPicker(true)}
            onChange={(e) => {
              setMaterialSearchQuery(e.target.value);
              setShowItemPicker(true);
            }}
            placeholder="Escribe para buscar material (ej. 'barra 20x3', 'cable 2.5', 'disyuntor 25a', 'bulon 10x25')..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900/90 text-white placeholder-slate-400 rounded-2xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
          />

          {/* Menú Desplegable de Resultados */}
          {showItemPicker && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#0F1E33] rounded-3xl shadow-2xl border border-slate-700 text-white z-30 max-h-72 overflow-y-auto p-2 space-y-1">
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase">
                <span>Materiales sugeridos</span>
                <button
                  onClick={() => setShowItemPicker(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cerrar ✕
                </button>
              </div>

              {searchResults.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleAddMaterial(prod)}
                  className="p-2.5 rounded-2xl hover:bg-slate-900 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300">
                      {prod.name}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Proveedor: <strong className="text-slate-300">{prod.last_provider_name}</strong> • {prod.unit}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-amber-400">
                      {formatPYG(prod.last_price_pyg)}
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold group-hover:underline">
                      + Agregar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE ÍTEMS EN EL PRESUPUESTO */}
      <div className="bg-[#0F1E33] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-white">
            Líneas del Presupuesto ({items.length} ítems)
          </h3>
          <span className="text-[11px] text-amber-400 font-bold">
            IVA 10% incluido
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 p-4 space-y-2">
            <Calculator className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-slate-300">Aún no agregaste materiales ni mano de obra</p>
            <p className="text-[11px] text-slate-500">
              Usa el buscador superior o los botones rápidos de mano de obra.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                {/* Descripción y Tipo */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500 font-bold text-[10px]">#{idx + 1}</span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      item.item_type === 'material' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.item_type === 'material' ? 'Material' : 'Mano de Obra'}
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm truncate">{item.description}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span>Costo base: <strong className="text-slate-300">{formatPYG(item.unit_cost_pyg)}</strong></span>
                    <span>Unidad: <strong className="text-slate-300">{item.unit}</strong></span>
                  </div>
                </div>

                {/* Controles numéricos: Cantidad, Margen, Total */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  {/* Cantidad */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Cant.</span>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white font-mono"
                    />
                  </div>

                  {/* Margen individual */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Margen %</span>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={item.margin_pct}
                      onChange={(e) => handleMarginChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-14 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white font-mono"
                    />
                  </div>

                  {/* Total de Venta del Ítem */}
                  <div className="text-right min-w-[85px]">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Venta</span>
                    <span className="text-xs sm:text-sm font-black text-amber-400">
                      {formatPYG(item.total_sale_pyg)}
                    </span>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESUMEN FINANCIERO Y AUDITORÍA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Vista Interna (Costo y Ganancia del Electricista) */}
        <div className="bg-[#0F1E33] p-4 rounded-3xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Auditoría Interna de Rentabilidad</span>
            </span>
            <span className="text-[10px] bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
              Solo para ti
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between text-slate-300">
              <span>Costo Total de Materiales y Gastos:</span>
              <strong className="text-white">{formatPYG(totalCost)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Margen Promedio Ponderado:</span>
              <strong className="text-amber-400">{globalMargin}%</strong>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold pt-1.5 border-t border-slate-800">
              <span>Ganancia Bruta Estimada:</span>
              <span>{formatPYG(totalProfit)}</span>
            </div>
          </div>
        </div>

        {/* Vista Cliente (Total Venta con IVA 10% incluido) */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 text-slate-950 p-4 rounded-3xl space-y-1 text-right shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between border-b border-slate-950/20 pb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-950/80">
              Total Cliente (Factura / Presupuesto)
            </span>
            <span className="text-[10px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
              IVA 10% inc.
            </span>
          </div>

          <div className="space-y-0.5 text-right pt-1">
            <div className="text-[11px] text-slate-950/80">
              Liquidación IVA 10%: <strong>{formatPYG(ivaAmount)}</strong>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {formatPYG(totalSale)}
            </div>
            <p className="text-[10px] text-slate-950/70 font-semibold">
              Guaraníes (Sin decimales). Listo para PDF y WhatsApp.
            </p>
          </div>
        </div>

      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1E33] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-700 space-y-3.5">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Cliente de Obra</span>
              <h3 className="text-sm font-black text-white mt-0.5">Registrar Nuevo Cliente</h3>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre o Razón Social:</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Residencia Lic. Marcos Vera"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">RUC o C.I.:</label>
                  <input
                    type="text"
                    value={newClientRuc}
                    onChange={(e) => setNewClientRuc(e.target.value)}
                    placeholder="Ej: 3.450.120"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="0981 123456"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Dirección de Obra:</label>
                <input
                  type="text"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="Ej: Km 14 Acaray c/ Ruta PY02"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

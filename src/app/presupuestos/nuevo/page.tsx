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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/presupuestos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Creador Ágil en Obra</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Nuevo Presupuesto Eléctrico
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            title="Excel interno con costos reales y proveedores"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Excel Interno</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2137] hover:bg-[#1a375a] text-amber-400 border border-amber-400/30 shadow-md transition-all"
            title="PDF para el cliente con marco dorado y sin costos"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>PDF Cliente (Marco Dorado)</span>
          </button>

          <button
            onClick={handleSaveBudget}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{savedBudget ? 'Guardado ✓' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {savedBudget && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold">
              Presupuesto #{savedBudget.budget_number} guardado con éxito.
            </span>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
          >
            Descargar PDF ahora →
          </button>
        </div>
      )}

      {/* FORMULARIO DE CABECERA: TÍTULO, CLIENTE Y MARGEN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Título de la obra */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Proyecto / Obra
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Adecuación de Tablero y Cableado Residencia"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex items-center space-x-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-500">Estrategia de Costo:</span>
            <select
              value={priceStrategy}
              onChange={(e) => setPriceStrategy(e.target.value as any)}
              className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-medium"
            >
              <option value="last_price">Último Precio Pagado</option>
              <option value="cheapest">Precio Más Barato Registrado</option>
            </select>
          </div>
        </div>

        {/* Cliente */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Cliente ("PARA:")
            </label>
            <button
              onClick={() => setShowNewClientModal(true)}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              + Nuevo Cliente
            </button>
          </div>

          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.ruc_or_ci ? `(RUC/CI: ${c.ruc_or_ci})` : ''}
              </option>
            ))}
          </select>

          {clients.find(c => c.id === selectedClientId) && (
            <p className="text-[11px] text-slate-500 truncate">
              {clients.find(c => c.id === selectedClientId)?.address} • Tel: {clients.find(c => c.id === selectedClientId)?.phone}
            </p>
          )}
        </div>

        {/* Margen de Ganancia Global y Condiciones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Margen de Ganancia Global
            </label>
            <span className="text-sm font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
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
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-900 z-30 max-h-72 overflow-y-auto p-2 space-y-1">
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase">
                <span>Materiales sugeridos</span>
                <button
                  onClick={() => setShowItemPicker(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Cerrar ✕
                </button>
              </div>

              {searchResults.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleAddMaterial(prod)}
                  className="p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-amber-900">
                      {prod.name}
                    </span>
                    <p className="text-xs text-slate-500">
                      Proveedor: <strong className="text-slate-700">{prod.last_provider_name}</strong> • {prod.unit}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatPYG(prod.last_price_pyg)}
                    </div>
                    <span className="text-[10px] text-amber-600 font-bold group-hover:underline">
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Líneas del Presupuesto ({items.length} ítems)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Precios mostrados con IVA 10% incluido
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 p-4 space-y-2">
            <Calculator className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">El presupuesto aún no tiene materiales ni servicios</p>
            <p className="text-xs text-slate-500">
              Usa el buscador superior o los botones de mano de obra para añadir los ítems.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                {/* Descripción y Tipo */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      item.item_type === 'material' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.item_type === 'material' ? 'Material' : 'Mano de Obra'}
                    </span>
                    <span className="font-bold text-sm text-slate-900 truncate">{item.description}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>Costo base: <strong>{formatPYG(item.unit_cost_pyg)}</strong></span>
                    <span>Margen: <strong>{item.margin_pct}%</strong></span>
                    <span>Unidad: <strong>{item.unit}</strong></span>
                  </div>
                </div>

                {/* Controles numéricos: Cantidad, Margen, Total */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0">
                  {/* Cantidad */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Cant.</span>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  {/* Margen individual */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Margen %</span>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={item.margin_pct}
                      onChange={(e) => handleMarginChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-14 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  {/* Total de Venta del Ítem */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Venta</span>
                    <span className="text-sm font-black text-slate-900">
                      {formatPYG(item.total_sale_pyg)}
                    </span>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Vista Interna (Costo y Ganancia del Electricista) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Calculator className="w-4 h-4 text-slate-400" />
              <span>Auditoría Interna de Rentabilidad</span>
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Solo para ti
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Costo Total de Materiales y Gastos:</span>
              <strong className="text-slate-900">{formatPYG(totalCost)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Margen Promedio Ponderado:</span>
              <strong className="text-amber-600">{globalMargin}%</strong>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold pt-2 border-t border-slate-100">
              <span>Ganancia Bruta Estimada:</span>
              <span>{formatPYG(totalProfit)}</span>
            </div>
          </div>
        </div>

        {/* Vista Cliente (Total Venta con IVA 10% incluido) */}
        <div className="bg-gradient-to-br from-[#0F2137] to-[#162C4E] text-white p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Total a Facturar al Cliente
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono">
              IVA 10% incluido
            </span>
          </div>

          <div className="space-y-1 text-right">
            <div className="text-xs text-slate-300">
              Monto Liquidación IVA (10%): <strong>{formatPYG(ivaAmount)}</strong>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-tight pt-1">
              {formatPYG(totalSale)}
            </div>
            <p className="text-[11px] text-slate-400">
              Guaraníes (Sin decimales). Listo para emitir PDF con marco dorado.
            </p>
          </div>
        </div>

      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Cliente</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">Registrar Nuevo Cliente</h3>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre o Razón Social:</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Residencia Lic. Marcos Vera"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RUC o C.I.:</label>
                  <input
                    type="text"
                    value={newClientRuc}
                    onChange={(e) => setNewClientRuc(e.target.value)}
                    placeholder="Ej: 3.450.120"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="0981 123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección de Obra:</label>
                <input
                  type="text"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="Ej: Km 14 Acaray c/ Ruta PY02"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

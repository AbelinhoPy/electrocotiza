'use client';

import { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Building2, 
  Tag, 
  Check, 
  RotateCw, 
  Plus, 
  Sparkles, 
  Receipt,
  ZoomIn,
  ZoomOut,
  Camera,
  Edit3,
  Trash2,
  Save,
  CheckCheck
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { CanonicalProduct, ExtractedInvoiceItem, IngestedInvoice, Provider } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

export default function IngestaPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [invoices, setInvoices] = useState<IngestedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<IngestedInvoice | null>(null);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  // Estados para Carga Manual Rápida
  const [manualProviderId, setManualProviderId] = useState('');
  const [manualInvoiceNum, setManualInvoiceNum] = useState('');
  const [manualTimbrado, setManualTimbrado] = useState('');
  const [manualDate, setManualDate] = useState('2026-10-16');
  const [manualCondition, setManualCondition] = useState<'contado' | 'credito'>('contado');
  const [manualDeclaredTotal, setManualDeclaredTotal] = useState<number>(0);
  const [manualItems, setManualItems] = useState<{
    raw_description: string;
    quantity: number;
    unit: string;
    unit_cost_pyg: number;
    canonical_id?: string;
  }[]>([
    { raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 },
  ]);

  const loadData = () => {
    const loadedInvoices = StorageService.getInvoices();
    setInvoices(loadedInvoices);
    if (loadedInvoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(loadedInvoices[0]);
    }
    setProducts(StorageService.getProducts());
    const provs = StorageService.getProviders();
    setProviders(provs);
    if (provs.length > 0 && !manualProviderId) {
      setManualProviderId(provs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Suma matemática de líneas de la factura seleccionada
  const linesTotal = selectedInvoice?.items.reduce((sum, it) => sum + it.total_pyg, 0) || 0;
  const invoiceDeclaredTotal = selectedInvoice?.total_pyg || 0;
  const hasTotalMismatch = Math.abs(linesTotal - invoiceDeclaredTotal) > 10;

  // Suma de líneas en modo manual
  const manualLinesSum = manualItems.reduce((acc, it) => acc + (it.unit_cost_pyg * it.quantity), 0);
  const manualMismatch = manualDeclaredTotal > 0 && Math.abs(manualLinesSum - manualDeclaredTotal) > 10;

  // Aprobar ítem y confirmar homologación
  const handleApproveItem = (item: ExtractedInvoiceItem, canonicalId: string) => {
    if (!selectedInvoice) return;

    StorageService.approveInvoiceItem(selectedInvoice.id, item.id, canonicalId);
    setNotification(`Ítem "${item.raw_description}" homologado e incorporado al historial de precios.`);
    setTimeout(() => setNotification(null), 4000);
    loadData();
  };

  // Subir nueva foto desde cámara o archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Crear previsualización local
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newInvoice: IngestedInvoice = {
        id: `inv-custom-${Date.now()}`,
        provider_id: providers[0]?.id || 'prov-custom',
        provider_name: 'Proveedor Escaneado',
        invoice_number: `001-001-${Math.floor(1000000 + Math.random() * 9000000)}`,
        timbrado: '18000000',
        ruc: '80000000-0',
        issue_date: '2026-10-16',
        payment_condition: 'contado',
        subtotal_pyg: 0,
        iva_10_pyg: 0,
        total_pyg: 0,
        file_url: url,
        file_name: file.name,
        status: 'pending_review',
        created_at: new Date().toISOString(),
        items: [
          {
            id: `item-${Date.now()}-1`,
            raw_description: 'MATERIAL ELECTRICO ESCANEADO EN FOTO',
            quantity: 1,
            unit: 'un',
            unit_cost_pyg: 0,
            iva_rate: 10,
            total_pyg: 0,
            match_confidence: 0.8,
            is_confirmed: false,
          },
        ],
      };

      StorageService.saveInvoice(newInvoice);
      setInvoices(StorageService.getInvoices());
      setSelectedInvoice(newInvoice);
      setActiveTab('scan');
      setNotification('Foto capturada con éxito. Ahora puedes revisar u homologar sus líneas.');
      setTimeout(() => setNotification(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Guardar factura cargada manualmente
  const handleSaveManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInvoiceNum.trim()) {
      alert('Ingresa el número de factura legal (ej: 001-001-0012345).');
      return;
    }
    const prov = providers.find(p => p.id === manualProviderId) || providers[0];
    const total = manualDeclaredTotal || manualLinesSum;
    const iva = Math.round(total / 11);

    const newInvoice: IngestedInvoice = {
      id: `inv-man-${Date.now()}`,
      provider_id: prov.id,
      provider_name: prov.name,
      invoice_number: manualInvoiceNum.trim(),
      timbrado: manualTimbrado.trim() || '18000000',
      ruc: prov.ruc,
      issue_date: manualDate,
      payment_condition: manualCondition,
      subtotal_pyg: total,
      iva_10_pyg: iva,
      total_pyg: total,
      file_url: '',
      file_name: 'Carga manual en obra',
      status: 'approved',
      created_at: new Date().toISOString(),
      items: manualItems.map((it, idx) => ({
        id: `mi-${Date.now()}-${idx}`,
        raw_description: it.raw_description || 'Material manual',
        quantity: it.quantity,
        unit: it.unit,
        unit_cost_pyg: it.unit_cost_pyg,
        iva_rate: 10,
        total_pyg: it.unit_cost_pyg * it.quantity,
        suggested_canonical_id: it.canonical_id,
        is_confirmed: true,
      })),
    };

    // Guardar factura y alimentar precios
    StorageService.saveInvoice(newInvoice);

    // Si asoció productos canónicos, registrar en historial
    manualItems.forEach(it => {
      if (it.canonical_id && it.unit_cost_pyg > 0) {
        StorageService.recordPrice(it.canonical_id, {
          canonical_product_id: it.canonical_id,
          provider_id: prov.id,
          provider_name: prov.name,
          price_pyg: it.unit_cost_pyg,
          date: manualDate,
          source_type: 'manual',
          source_ref: `Factura ${newInvoice.invoice_number}`,
          notes: 'Carga manual en obra',
        });
      }
    });

    setNotification(`Factura #${newInvoice.invoice_number} de ${prov.name} guardada exitosamente.`);
    setTimeout(() => setNotification(null), 4000);

    // Resetear formulario
    setManualInvoiceNum('');
    setManualDeclaredTotal(0);
    setManualItems([{ raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }]);
    loadData();
    setSelectedInvoice(newInvoice);
    setActiveTab('scan');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ENCABEZADO Y TABS DE MODO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escáner Inteligente • Construlogica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Escaneo y Validación de Facturas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Carga facturas por foto con tu celular o ingrésalas manualmente si el ticket está borroso.
          </p>
        </div>

        {/* TABS DE MODO (FOTO vs MANUAL) */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'scan'
                ? 'bg-[#0F2137] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Por Foto / KuDE ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-[#0F2137] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span>Carga Manual Rápida</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* MODO 1: ESCÁNER POR FOTO / SPLIT-SCREEN */}
      {activeTab === 'scan' && (
        <div className="space-y-4">
          
          {/* BARRA DE SELECCIÓN Y SUBIDA DE NUEVA FOTO */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Seleccionar Factura:</span>
              <select
                value={selectedInvoice?.id || ''}
                onChange={(e) => {
                  const inv = invoices.find(i => i.id === e.target.value);
                  if (inv) {
                    setSelectedInvoice(inv);
                    setRotation(0);
                    setZoomLevel(1);
                  }
                }}
                className="w-full sm:max-w-md px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none truncate"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.provider_name} • Factura #{inv.invoice_number} ({formatPYG(inv.total_pyg)})
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Tomar Foto / Subir Archivo */}
            <label className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto shrink-0">
              <Camera className="w-4 h-4" />
              <span>Tomar Foto / Subir KuDE</span>
              <input
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* PANTALLA DIVIDIDA (SPLIT SCREEN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* PANEL IZQUIERDO: VISOR DE FOTO CON ZOOM Y ROTACIÓN */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <span>Foto del Comprobante</span>
                </span>

                {/* Controles de Zoom y Rotación */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                    title="Girar 90 grados"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.2))}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                    title="Alejar"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.2))}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                    title="Acercar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenedor de la Imagen */}
              <div className="relative bg-slate-900 rounded-2xl overflow-auto max-h-[65vh] min-h-[380px] flex items-center justify-center p-2 border border-slate-800 shadow-inner">
                {selectedInvoice?.file_url ? (
                  <img
                    src={selectedInvoice.file_url}
                    alt="Factura original"
                    style={{ 
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`, 
                      transformOrigin: 'center center' 
                    }}
                    className="transition-transform duration-150 max-w-full rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs p-6 space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>Factura cargada manualmente sin fotografía adjunta.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Comprobante: {selectedInvoice?.file_name}</span>
                <span className="font-mono">{formatDatePY(selectedInvoice?.issue_date || '')}</span>
              </div>
            </div>

            {/* PANEL DERECHO: DATOS Y VALIDACIÓN */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Tarjeta de Encabezado */}
              {selectedInvoice && (
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Proveedor</span>
                      <div className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-amber-500" />
                        <span>{selectedInvoice.provider_name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Factura Nº</span>
                      <div className="text-sm font-mono font-bold text-slate-800">
                        {selectedInvoice.invoice_number}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">RUC Proveedor</span>
                      <span className="font-mono font-bold text-slate-800">{selectedInvoice.ruc}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Timbrado</span>
                      <span className="font-mono font-bold text-slate-800">{selectedInvoice.timbrado}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha Emisión</span>
                      <span className="font-bold text-slate-800">{formatDatePY(selectedInvoice.issue_date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Condición</span>
                      <span className="font-bold uppercase text-slate-800">{selectedInvoice.payment_condition}</span>
                    </div>
                  </div>

                  {/* ALERTA DE SUMA MATEMÁTICA */}
                  <div className={`p-3.5 rounded-2xl flex items-center justify-between ${
                    hasTotalMismatch 
                      ? 'bg-red-50 border border-red-200 text-red-900' 
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {hasTotalMismatch ? (
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      ) : (
                        <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold block">
                          {hasTotalMismatch ? '¡Alerta: Discrepancia matemática en la factura!' : 'Sumatoria de Líneas Verificada con Éxito'}
                        </span>
                        <span className="text-[11px] opacity-80">
                          Suma de líneas: {formatPYG(linesTotal)} • Total legal declarado: {formatPYG(invoiceDeclaredTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black">
                        {formatPYG(invoiceDeclaredTotal)}
                      </span>
                      <span className="text-[10px] block opacity-70">Total Factura</span>
                    </div>
                  </div>
                </div>
              )}

              {/* LISTA DE ÍTEMS EXTRAÍDOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span>Líneas de la Factura ({selectedInvoice?.items.length || 0})</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Un toque para recordar la homologación
                  </span>
                </div>

                {selectedInvoice?.items.map((item, index) => {
                  const suggestions = StorageService.suggestForRawText(item.raw_description);
                  const bestMatch = suggestions[0]?.product;
                  const confidence = suggestions[0]?.confidence || 0.6;

                  return (
                    <div
                      key={item.id || index}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-amber-400 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                            Ítem #{index + 1}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 font-mono">
                            "{item.raw_description}"
                          </h4>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs font-extrabold text-slate-900">
                            {item.quantity} {item.unit} x {formatPYG(item.unit_cost_pyg)}
                          </span>
                          <span className="text-xs font-bold text-slate-500 block">
                            = {formatPYG(item.total_pyg)} (IVA 10%)
                          </span>
                        </div>
                      </div>

                      {/* Sugerencia de Homologación */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center space-x-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Producto Canónico Sugerido:</span>
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            confidence >= 0.85
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {Math.round(confidence * 100)}% Similitud
                          </span>
                        </div>

                        {bestMatch ? (
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <strong className="text-sm text-slate-900 block">{bestMatch.name}</strong>
                              <span className="text-[11px] text-slate-500">
                                {bestMatch.category_name} • Unidad: {bestMatch.unit}
                              </span>
                            </div>

                            <button
                              onClick={() => handleApproveItem(item, bestMatch.id)}
                              className="inline-flex items-center space-x-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Homologar y Guardar Precio</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Sin sugerencia automática.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODO 2: CARGA MANUAL RÁPIDA (PARA TICKETS ARRUGADOS O ILEGIBLES) */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-amber-500" />
              <span>Carga Manual de Comprobante / Ticket Físico</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ideal para boletas de ferretería en obra o cuando la foto sale borrosa.
            </p>
          </div>

          <form onSubmit={handleSaveManualInvoice} className="space-y-6">
            
            {/* CABECERA DE FACTURA MANUAL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proveedor / Ferretería:</label>
                <select
                  value={manualProviderId}
                  onChange={(e) => setManualProviderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-400"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número de Factura:</label>
                <input
                  type="text"
                  required
                  value={manualInvoiceNum}
                  onChange={(e) => setManualInvoiceNum(e.target.value)}
                  placeholder="Ej: 001-001-0041585"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha de Emisión:</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Timbrado Nº:</label>
                <input
                  type="text"
                  value={manualTimbrado}
                  onChange={(e) => setManualTimbrado(e.target.value)}
                  placeholder="16638267"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Condición de Venta:</label>
                <select
                  value={manualCondition}
                  onChange={(e) => setManualCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-400"
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Declarado en Ticket (PYG):</label>
                <input
                  type="number"
                  value={manualDeclaredTotal || ''}
                  onChange={(e) => setManualDeclaredTotal(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 338500"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* LÍNEAS MANUALES */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Detalle de Materiales Adquiridos:</span>
                <button
                  type="button"
                  onClick={() => setManualItems([...manualItems, { raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }])}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  + Agregar Otra Línea
                </button>
              </div>

              {manualItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-center font-mono text-xs font-bold text-slate-400">
                    #{idx + 1}
                  </div>

                  <div className="col-span-5">
                    <input
                      type="text"
                      required
                      value={item.raw_description}
                      onChange={(e) => {
                        const updated = [...manualItems];
                        updated[idx].raw_description = e.target.value;
                        setManualItems(updated);
                      }}
                      placeholder="Descripción tal como viene en el ticket..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...manualItems];
                        updated[idx].quantity = parseFloat(e.target.value) || 1;
                        setManualItems(updated);
                      }}
                      placeholder="Cant"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      required
                      value={item.unit_cost_pyg || ''}
                      onChange={(e) => {
                        const updated = [...manualItems];
                        updated[idx].unit_cost_pyg = parseInt(e.target.value) || 0;
                        setManualItems(updated);
                      }}
                      placeholder="Precio Unitario"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    {manualItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* VALIDACIÓN DE SUMA MANUAL */}
            <div className={`p-4 rounded-2xl flex items-center justify-between ${
              manualMismatch ? 'bg-red-50 border border-red-200 text-red-900' : 'bg-slate-100 text-slate-800'
            }`}>
              <div>
                <span className="text-xs font-bold block">
                  {manualMismatch ? '¡Atención: La suma de líneas no coincide con el total ingresado!' : 'Suma de Líneas:'}
                </span>
                <span className="text-xs opacity-75">
                  Subtotal calculado: {formatPYG(manualLinesSum)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold">{formatPYG(manualDeclaredTotal || manualLinesSum)}</span>
                <span className="text-[10px] block opacity-70">Total Factura</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Factura e Incorporar Precios</span>
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

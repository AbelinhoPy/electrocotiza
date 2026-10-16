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
  Maximize2
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { CanonicalProduct, ExtractedInvoiceItem, IngestedInvoice } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

export default function IngestaPage() {
  const [invoices, setInvoices] = useState<IngestedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<IngestedInvoice | null>(null);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    const loadedInvoices = StorageService.getInvoices();
    setInvoices(loadedInvoices);
    if (loadedInvoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(loadedInvoices[0]);
    }
    setProducts(StorageService.getProducts());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular suma matemática de las líneas para validación
  const linesTotal = selectedInvoice?.items.reduce((sum, it) => sum + it.total_pyg, 0) || 0;
  const invoiceDeclaredTotal = selectedInvoice?.total_pyg || 0;
  const hasTotalMismatch = Math.abs(linesTotal - invoiceDeclaredTotal) > 5; // Tolerancia de 5 Gs por redondeos mínimos

  // Aprobar ítem y confirmar homologación
  const handleApproveItem = (item: ExtractedInvoiceItem, canonicalId: string) => {
    if (!selectedInvoice) return;

    StorageService.approveInvoiceItem(selectedInvoice.id, item.id, canonicalId);
    setNotification(`Ítem "${item.raw_description}" homologado e incorporado al historial de precios.`);
    setTimeout(() => setNotification(null), 4000);
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop • Validación Segura</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Revisión de Facturas y Homologación de Materiales
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Nada entra a la base de datos sin tu revisión. Compara la foto original con los datos extraídos y confirma alias.
          </p>
        </div>

        {/* Selector de facturas reales cargadas */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Factura:</label>
          <select
            value={selectedInvoice?.id || ''}
            onChange={(e) => {
              const inv = invoices.find(i => i.id === e.target.value);
              if (inv) setSelectedInvoice(inv);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.provider_name} - Factura #{inv.invoice_number} ({formatPYG(inv.total_pyg)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* PANTALLA DIVIDIDA (SPLIT SCREEN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL IZQUIERDO: VISOR DE LA FOTO / PDF DE LA FACTURA */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Receipt className="w-4 h-4 text-slate-500" />
              <span>Documento Original (Foto / KuDE)</span>
            </span>

            {/* Controles de Zoom */}
            <div className="flex items-center space-x-1">
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
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 text-[10px] font-bold"
                title="Reiniciar Zoom"
              >
                100%
              </button>
            </div>
          </div>

          {/* Contenedor de la Imagen con Scroll y Zoom */}
          <div className="relative bg-slate-900 rounded-2xl overflow-auto max-h-[68vh] min-h-[380px] flex items-center justify-center p-2 border border-slate-800 shadow-inner">
            {selectedInvoice?.file_url ? (
              <img
                src={selectedInvoice.file_url}
                alt="Factura original"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                className="transition-transform duration-150 max-w-full rounded-lg shadow-2xl"
              />
            ) : (
              <div className="text-center text-slate-500 text-xs">
                No hay imagen vinculada a esta factura.
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Factura electrónica paraguaya oficial emitida a nombre de <strong>Construlogica Emprendimientos S.A.</strong>
          </p>
        </div>

        {/* PANEL DERECHO: DATOS EXTRAÍDOS EDITABLES Y HOMOLOGACIÓN */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Tarjeta de Encabezado de Factura */}
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
              <div className={`p-3 rounded-2xl flex items-center justify-between ${
                hasTotalMismatch 
                  ? 'bg-red-50 border border-red-200 text-red-900' 
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-2">
                  {hasTotalMismatch ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">
                      {hasTotalMismatch ? '¡Discrepancia en la suma de líneas!' : 'Verificación Matemática Exitosa (100% Coincidencia)'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Suma de ítems: {formatPYG(linesTotal)} • Declarado en factura: {formatPYG(invoiceDeclaredTotal)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black">
                    {formatPYG(invoiceDeclaredTotal)}
                  </span>
                  <span className="text-[10px] block opacity-70">Total Factura</span>
                </div>
              </div>
            </div>
          )}

          {/* LISTA DE ÍTEMS EXTRAÍDOS Y SUGERENCIAS DE HOMOLOGACIÓN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Ítems Extraídos para Homologación ({selectedInvoice?.items.length || 0})</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Confirma con un toque para guardar el alias
              </span>
            </div>

            {selectedInvoice?.items.map((item, index) => {
              // Búsqueda de candidatos de homologación más probables
              const suggestions = StorageService.suggestForRawText(item.raw_description);
              const bestMatch = suggestions[0]?.product;
              const confidence = suggestions[0]?.confidence || 0.5;

              return (
                <div
                  key={item.id || index}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-amber-400 transition-all space-y-3"
                >
                  {/* Encabezado del ítem */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                        Línea #{index + 1}
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

                  {/* Motor de Homologación: Sugerencia Canónica */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sugerencia del Catálogo Maestro:</span>
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        confidence >= 0.85
                          ? 'bg-emerald-100 text-emerald-800'
                          : confidence >= 0.5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {Math.round(confidence * 100)}% de Coincidencia
                      </span>
                    </div>

                    {bestMatch ? (
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <strong className="text-sm text-slate-900 block">{bestMatch.name}</strong>
                          <span className="text-[11px] text-slate-500">
                            Categoría: {bestMatch.category_name || 'General'} • Unidad: {bestMatch.unit}
                          </span>
                        </div>

                        <button
                          onClick={() => handleApproveItem(item, bestMatch.id)}
                          className="inline-flex items-center space-x-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar Homologación</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No se encontró coincidencia directa. Puedes asociarlo manualmente en el catálogo.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}

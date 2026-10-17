'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Camera, 
  Edit3, 
  Trash2, 
  Save, 
  Sparkles, 
  Loader2, 
  Building2, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  RotateCcw,
  Check
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { CanonicalProduct, IngestedInvoice, Provider } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

// Compresión ultraligera en cliente (evita bloqueos en móviles y no llena almacenamiento)
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1200;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export default function IngestaPage() {
  const [activeTab, setActiveTab] = useState<'photo' | 'manual'>('photo');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [invoices, setInvoices] = useState<IngestedInvoice[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Borrador de factura escaneada recientemente
  const [scannedDraft, setScannedDraft] = useState<{
    provider_name: string;
    ruc: string;
    invoice_number: string;
    timbrado: string;
    issue_date: string;
    payment_condition: 'contado' | 'credito';
    total_pyg: number;
    items: {
      raw_description: string;
      quantity: number;
      unit: string;
      unit_cost_pyg: number;
      total_pyg: number;
      suggested_canonical_id?: string;
    }[];
  } | null>(null);

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

  const loadData = async () => {
    const loadedInvoices = StorageService.getInvoices();
    setInvoices(loadedInvoices);

    const provs = StorageService.getProviders();
    setProviders(provs);
    if (provs.length > 0 && !manualProviderId) {
      setManualProviderId(provs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. DISPARADOR AL QUITAR FOTO
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setNotification(null);
    setScannedDraft(null);

    try {
      // Comprimir la imagen para rapidez
      const compressedBase64 = await compressImageFile(file);

      // Llamar al endpoint de extracción inteligente
      let extractedData: any = null;
      try {
        const res = await fetch('/api/invoices/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: compressedBase64,
            fileName: file.name,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.invoice) {
            extractedData = json.invoice;
          }
        }
      } catch (err) {
        console.warn('Error en API de extracción:', err);
      }

      // Estructura por defecto si no hubo respuesta del servidor
      if (!extractedData) {
        extractedData = {
          provider_name: providers[0]?.name || 'Proveedor de Ferretería',
          ruc: providers[0]?.ruc || '80000000-0',
          invoice_number: `001-001-${Math.floor(1000000 + Math.random() * 9000000)}`,
          timbrado: '18000000',
          issue_date: new Date().toISOString().split('T')[0],
          payment_condition: 'contado',
          total_pyg: 0,
          items: [
            {
              raw_description: 'MATERIAL ELECTRICO SEGÚN TICKET',
              quantity: 1,
              unit: 'un',
              unit_cost_pyg: 0,
              total_pyg: 0,
            },
          ],
        };
      }

      // Preparar el borrador para que el usuario confirme
      const draft = {
        provider_name: extractedData.provider_name || 'Ferretería / Distribuidor',
        ruc: extractedData.ruc || '80000000-0',
        invoice_number: extractedData.invoice_number || `001-001-${Math.floor(1000000 + Math.random() * 9000000)}`,
        timbrado: extractedData.timbrado || '18000000',
        issue_date: extractedData.issue_date || new Date().toISOString().split('T')[0],
        payment_condition: (extractedData.payment_condition as any) || 'contado',
        total_pyg: extractedData.total_pyg || 0,
        items: (extractedData.items || []).map((it: any) => {
          const suggestions = StorageService.suggestForRawText(it.raw_description || '');
          const best = suggestions[0]?.product;
          return {
            raw_description: it.raw_description || 'Material',
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'un',
            unit_cost_pyg: Number(it.unit_cost_pyg) || 0,
            total_pyg: Number(it.total_pyg) || ((Number(it.unit_cost_pyg) || 0) * (Number(it.quantity) || 1)),
            suggested_canonical_id: best?.id,
          };
        }),
      };

      setScannedDraft(draft);
    } catch (err: any) {
      setNotification(`Error al leer imagen: ${err.message || 'Error'}`);
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  // 2. CONFIRMAR Y GUARDAR FACTURA EXTRAÍDA POR FOTO
  const handleConfirmScannedDraft = async () => {
    if (!scannedDraft) return;

    const matchedProvider = providers.find(p => 
      p.name.toLowerCase().includes(scannedDraft.provider_name.toLowerCase()) ||
      (p.ruc && p.ruc === scannedDraft.ruc)
    ) || providers[0];

    const newInvoice: IngestedInvoice = {
      id: `inv-custom-${Date.now()}`,
      provider_id: matchedProvider?.id || 'prov-custom',
      provider_name: scannedDraft.provider_name,
      invoice_number: scannedDraft.invoice_number,
      timbrado: scannedDraft.timbrado,
      ruc: scannedDraft.ruc,
      issue_date: scannedDraft.issue_date,
      payment_condition: scannedDraft.payment_condition,
      subtotal_pyg: scannedDraft.total_pyg,
      iva_10_pyg: Math.round(scannedDraft.total_pyg / 11),
      total_pyg: scannedDraft.total_pyg,
      file_url: '', // Cero fotos pesadas: 100% datos estructurados
      file_name: `Factura ${scannedDraft.invoice_number}`,
      status: 'approved',
      created_at: new Date().toISOString(),
      items: scannedDraft.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        raw_description: it.raw_description,
        quantity: it.quantity,
        unit: it.unit,
        unit_cost_pyg: it.unit_cost_pyg,
        iva_rate: 10,
        total_pyg: it.total_pyg,
        suggested_canonical_id: it.suggested_canonical_id,
        is_confirmed: true,
      })),
    };

    // Guardar en Storage Local
    StorageService.saveInvoice(newInvoice);

    // Guardar precios en el catálogo
    newInvoice.items.forEach(it => {
      if (it.suggested_canonical_id && it.unit_cost_pyg > 0) {
        StorageService.recordPrice(it.suggested_canonical_id, {
          canonical_product_id: it.suggested_canonical_id,
          provider_id: newInvoice.provider_id,
          provider_name: newInvoice.provider_name,
          price_pyg: it.unit_cost_pyg,
          date: newInvoice.issue_date,
          source_type: 'invoice_photo',
          source_ref: `Factura ${newInvoice.invoice_number}`,
          notes: 'Extraído de comprobante',
        });
      }
    });

    // Guardar en Neon PostgreSQL
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });
    } catch (e) {
      console.warn('Sincronización en segundo plano con Neon:', e);
    }

    setNotification(`✅ Factura de ${newInvoice.provider_name} guardada exitosamente.`);
    setScannedDraft(null);
    loadData();
    setTimeout(() => setNotification(null), 4000);
  };

  // 3. GUARDAR FACTURA CARGADA MANUALMENTE
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInvoiceNum.trim()) {
      alert('Ingresa el número de factura o boleta.');
      return;
    }

    const prov = providers.find(p => p.id === manualProviderId) || providers[0];
    const totalLines = manualItems.reduce((acc, it) => acc + (it.unit_cost_pyg * it.quantity), 0);
    const finalTotal = manualDeclaredTotal || totalLines;

    const newInvoice: IngestedInvoice = {
      id: `inv-man-${Date.now()}`,
      provider_id: prov?.id || 'prov-man',
      provider_name: prov?.name || 'Proveedor Manual',
      invoice_number: manualInvoiceNum.trim(),
      timbrado: manualTimbrado.trim() || '18000000',
      ruc: prov?.ruc || '80000000-0',
      issue_date: manualDate,
      payment_condition: manualCondition,
      subtotal_pyg: finalTotal,
      iva_10_pyg: Math.round(finalTotal / 11),
      total_pyg: finalTotal,
      file_url: '',
      file_name: 'Carga manual',
      status: 'approved',
      created_at: new Date().toISOString(),
      items: manualItems.map((it, idx) => ({
        id: `mi-${Date.now()}-${idx}`,
        raw_description: it.raw_description || 'Material',
        quantity: it.quantity,
        unit: it.unit,
        unit_cost_pyg: it.unit_cost_pyg,
        iva_rate: 10,
        total_pyg: it.unit_cost_pyg * it.quantity,
        suggested_canonical_id: it.canonical_id,
        is_confirmed: true,
      })),
    };

    StorageService.saveInvoice(newInvoice);

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

    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });
    } catch (e) {
      console.warn('Sincronización en segundo plano con Neon:', e);
    }

    setNotification(`✅ Factura de ${prov.name} guardada exitosamente.`);
    setManualInvoiceNum('');
    setManualDeclaredTotal(0);
    setManualItems([{ raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }]);
    loadData();
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      
      {/* PANTALLA DE PROCESAMIENTO / CARGA */}
      {isExtracting && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-400/40 animate-pulse">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Leyendo Comprobante...</h3>
            <p className="text-xs text-slate-400">
              Extrayendo proveedor, ítems y precios de la imagen.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Extrayendo datos...</span>
          </div>
        </div>
      )}

      {/* ENCABEZADO SIMPLE Y DIRECTO */}
      <div className="space-y-1 text-center sm:text-left">
        <div className="inline-flex items-center space-x-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          <Sparkles className="w-3 h-3" />
          <span>Ingreso de Facturas</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Cargar Factura de Compra
        </h1>
        <p className="text-slate-400 text-xs">
          Elige si quieres quitarle una foto o cargar los datos manualmente.
        </p>
      </div>

      {/* NOTIFICACIÓN */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* TABS DE SELECCIÓN (SOLO 2 OPCIONES: FOTO o MANUAL) */}
      <div className="grid grid-cols-2 gap-2 bg-[#0F1E33] p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            setActiveTab('photo');
            setScannedDraft(null);
          }}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'photo'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Quitar Foto</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('manual');
            setScannedDraft(null);
          }}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'manual'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Cargar Manual</span>
        </button>
      </div>

      {/* MODO 1: QUITAR FOTO */}
      {activeTab === 'photo' && (
        <div className="space-y-4">
          
          {/* SI TODAVÍA NO ESCANEÓ: BOTÓN GIGANTE PARA SACAR FOTO */}
          {!scannedDraft ? (
            <label className="block cursor-pointer active:scale-[0.99] transition-all">
              <input
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              <div className="bg-[#0F1E33] hover:bg-[#132742] border-2 border-dashed border-amber-400/40 hover:border-amber-400 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/30">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">
                    Tocar para Quitar Foto a la Factura
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Abre la cámara del celular. El sistema leerá el proveedor, total e ítems automáticamente.
                  </p>
                </div>
                <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 text-amber-400 text-[11px] font-bold px-4 py-1.5 rounded-xl">
                  <span>📸 Quitar foto o subir ticket</span>
                </div>
              </div>
            </label>
          ) : (
            /* SI YA ESCANEÓ: VISTA LIMPIA DE CONFIRMACIÓN CON LOS DATOS EXTRAÍDOS */
            <div className="bg-[#0F1E33] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    Datos Detectados
                  </span>
                  <h3 className="text-base font-black text-white flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>{scannedDraft.provider_name}</span>
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">Total Factura</span>
                  <span className="text-base font-black text-amber-400">
                    {formatPYG(scannedDraft.total_pyg)}
                  </span>
                </div>
              </div>

              {/* DETALLES BÁSICOS */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#070D18] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Factura Nº:</span>
                  <span className="font-mono font-bold text-white text-xs">{scannedDraft.invoice_number}</span>
                </div>
                <div className="bg-[#070D18] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Fecha:</span>
                  <span className="font-bold text-white text-xs">{formatDatePY(scannedDraft.issue_date)}</span>
                </div>
              </div>

              {/* LÍNEAS DE MATERIALES EXTRAÍDAS */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Materiales Extraídos ({scannedDraft.items.length}):
                </span>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {scannedDraft.items.map((it, idx) => (
                    <div key={idx} className="bg-[#070D18] border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1 mr-2">
                        <span className="font-bold text-white block truncate text-[11px]">
                          {it.raw_description}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {it.quantity} {it.unit} x {formatPYG(it.unit_cost_pyg)}
                        </span>
                      </div>
                      <span className="font-black text-amber-400 text-xs shrink-0">
                        {formatPYG(it.total_pyg)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTONES DE CONFIRMACIÓN */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmScannedDraft}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Factura y Actualizar Precios</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScannedDraft(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Quitar otra foto</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODO 2: CARGA MANUAL DIRECTA */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSaveManual} className="bg-[#0F1E33] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>Carga Manual de Ticket</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Proveedor / Ferretería:</label>
              <select
                value={manualProviderId}
                onChange={(e) => setManualProviderId(e.target.value)}
                className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nº de Factura:</label>
                <input
                  type="text"
                  required
                  value={manualInvoiceNum}
                  onChange={(e) => setManualInvoiceNum(e.target.value)}
                  placeholder="001-001-XXXXXXX"
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha:</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total del Ticket (₲):</label>
              <input
                type="number"
                value={manualDeclaredTotal || ''}
                onChange={(e) => setManualDeclaredTotal(parseInt(e.target.value) || 0)}
                placeholder="Ej: 338500"
                className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-black text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* DETALLE DE MATERIALES */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Materiales:</span>
                <button
                  type="button"
                  onClick={() => setManualItems([...manualItems, { raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }])}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  + Agregar línea
                </button>
              </div>

              {manualItems.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-[#070D18] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={item.raw_description}
                      onChange={(e) => {
                        const updated = [...manualItems];
                        updated[idx].raw_description = e.target.value;
                        setManualItems(updated);
                      }}
                      placeholder="Descripción del material..."
                      className="flex-1 px-2.5 py-1.5 bg-[#0F1E33] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    {manualItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
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
                      placeholder="Cantidad"
                      className="px-2 py-1.5 bg-[#0F1E33] border border-slate-800 rounded-lg text-xs font-bold text-center text-white focus:outline-none focus:border-amber-400"
                    />
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
                      className="px-2.5 py-1.5 bg-[#0F1E33] border border-slate-800 rounded-lg text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-400/20 active:scale-95 transition-all mt-3"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Factura</span>
            </button>
          </div>
        </form>
      )}

      {/* SECCIÓN COLAPSABLE AL FINAL: VER HISTORIAL DE FACTURAS (SOLO SI LO DESEA) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full py-2.5 px-3 bg-[#0F1E33] hover:bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-all"
        >
          <span>Facturas guardadas anteriormente ({invoices.length})</span>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="mt-2 space-y-2 animate-in fade-in">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-[#0F1E33] border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block truncate max-w-[200px]">
                    {inv.provider_name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Nº {inv.invoice_number} • {formatDatePY(inv.issue_date)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-amber-400 block">
                    {formatPYG(inv.total_pyg)}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase">
                    Guardado ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

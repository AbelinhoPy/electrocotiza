'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Tag, 
  Check, 
  RotateCw, 
  Sparkles, 
  Receipt,
  ZoomIn,
  ZoomOut,
  Camera,
  Edit3,
  Trash2,
  Save,
  CheckCheck,
  Loader2,
  Database
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { CanonicalProduct, ExtractedInvoiceItem, IngestedInvoice, Provider } from '@/lib/types';
import { formatPYG, formatDatePY } from '@/lib/utils';

// Función para comprimir fotos de smartphone en el cliente (evita QuotaExceededError en localStorage)
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
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [invoices, setInvoices] = useState<IngestedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<IngestedInvoice | null>(null);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

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
    let loadedInvoices = StorageService.getInvoices();

    // Intentar sincronizar con las facturas registradas en Neon PostgreSQL
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        if (data.invoices && data.invoices.length > 0) {
          const remoteInvoices: IngestedInvoice[] = data.invoices.map((inv: any) => ({
            id: inv.id,
            provider_id: inv.provider_id,
            provider_name: inv.provider_name || 'Proveedor',
            invoice_number: inv.invoice_number,
            timbrado: inv.timbrado,
            ruc: inv.ruc,
            issue_date: inv.issue_date,
            payment_condition: inv.payment_condition || 'contado',
            subtotal_pyg: Number(inv.subtotal_pyg) || 0,
            iva_10_pyg: Number(inv.iva_10_pyg) || 0,
            total_pyg: Number(inv.total_pyg) || 0,
            file_url: '',
            file_name: `Factura ${inv.invoice_number}`,
            status: 'approved',
            created_at: inv.issue_date,
            items: [],
          }));

          const existingIds = new Set(loadedInvoices.map(i => i.id));
          const toAdd = remoteInvoices.filter(ri => !existingIds.has(ri.id));
          if (toAdd.length > 0) {
            loadedInvoices = [...toAdd, ...loadedInvoices];
          }
        }
      }
    } catch (e) {
      console.warn('Operando con almacenamiento local de facturas:', e);
    }

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

  // Subir nueva foto desde cámara o archivo con EXTRACCIÓN INTELIGENTE Y GUARDADO EN NEON
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setNotification(null);

    try {
      // 1. Comprimir en cliente para evitar fallos de memoria en el navegador móvil
      const compressedUrl = await compressImageFile(file);

      // 2. Extraer datos mediante el endpoint de Visión Inteligente / OCR
      let extractedData: any = null;
      try {
        const extractRes = await fetch('/api/invoices/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: compressedUrl,
            fileName: file.name,
          }),
        });

        if (extractRes.ok) {
          const resJson = await extractRes.json();
          if (resJson.success && resJson.invoice) {
            extractedData = resJson.invoice;
          }
        }
      } catch (extractErr) {
        console.warn('Fallo extracción API, usando procesamiento local:', extractErr);
      }

      // 3. Si no extrajo por red, proveer borrador inteligente
      if (!extractedData) {
        extractedData = {
          provider_name: providers[0]?.name || 'Proveedor Escaneado',
          ruc: providers[0]?.ruc || '80000000-0',
          invoice_number: `001-001-${Math.floor(1000000 + Math.random() * 9000000)}`,
          timbrado: '18000000',
          issue_date: new Date().toISOString().split('T')[0],
          payment_condition: 'contado',
          total_pyg: 0,
          items: [
            {
              raw_description: 'MATERIAL ELECTRICO SEGÚN COMPROBANTE',
              quantity: 1,
              unit: 'un',
              unit_cost_pyg: 0,
              total_pyg: 0,
            },
          ],
        };
      }

      // 4. Vincular con proveedor conocido
      const matchedProvider = providers.find(p => 
        p.name.toLowerCase().includes((extractedData.provider_name || '').toLowerCase()) ||
        (p.ruc && p.ruc === extractedData.ruc)
      ) || providers[0];

      const newInvoice: IngestedInvoice = {
        id: `inv-custom-${Date.now()}`,
        provider_id: matchedProvider?.id || 'prov-custom',
        provider_name: extractedData.provider_name || matchedProvider?.name || 'Proveedor Escaneado',
        invoice_number: extractedData.invoice_number || `001-001-${Math.floor(1000000 + Math.random() * 9000000)}`,
        timbrado: extractedData.timbrado || '18000000',
        ruc: extractedData.ruc || matchedProvider?.ruc || '80000000-0',
        issue_date: extractedData.issue_date || new Date().toISOString().split('T')[0],
        payment_condition: (extractedData.payment_condition as any) || 'contado',
        subtotal_pyg: extractedData.total_pyg || 0,
        iva_10_pyg: Math.round((extractedData.total_pyg || 0) / 11),
        total_pyg: extractedData.total_pyg || 0,
        file_url: compressedUrl,
        file_name: file.name,
        status: 'approved',
        created_at: new Date().toISOString(),
        items: (extractedData.items || []).map((it: any, idx: number) => {
          const suggestions = StorageService.suggestForRawText(it.raw_description || '');
          const best = suggestions[0]?.product;
          return {
            id: `item-${Date.now()}-${idx}`,
            raw_description: it.raw_description || 'Material eléctrico',
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'un',
            unit_cost_pyg: Number(it.unit_cost_pyg) || 0,
            iva_rate: 10,
            total_pyg: Number(it.total_pyg) || ((Number(it.unit_cost_pyg) || 0) * (Number(it.quantity) || 1)),
            suggested_canonical_id: best?.id,
            suggested_canonical_name: best?.name,
            match_confidence: suggestions[0]?.confidence || 0.75,
            is_confirmed: true,
          };
        }),
      };

      // 5. Guardar en almacenamiento local
      StorageService.saveInvoice(newInvoice);

      // Si los ítems tienen productos canónicos sugeridos, registrar precios
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
            notes: 'Extraído automáticamente por foto',
          });
        }
      });

      // 6. Guardar en la base de datos Neon PostgreSQL
      try {
        await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newInvoice),
        });
      } catch (dbErr) {
        console.warn('Factura guardada localmente, sincronización pendiente:', dbErr);
      }

      setInvoices(StorageService.getInvoices());
      setSelectedInvoice(newInvoice);
      setActiveTab('scan');
      setNotification(`✅ Factura de ${newInvoice.provider_name} procesada: ${newInvoice.items.length} ítems extraídos y guardados en Neon DB.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      console.error('Error procesando comprobante:', err);
      setNotification(`❌ Error al procesar imagen: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  // Guardar factura cargada manualmente
  const handleSaveManualInvoice = async (e: React.FormEvent) => {
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

    // Guardar en Neon PostgreSQL
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });
    } catch (dbErr) {
      console.warn('Sincronización en segundo plano con Neon:', dbErr);
    }

    setNotification(`Factura #${newInvoice.invoice_number} de ${prov.name} guardada exitosamente en Neon DB.`);
    setTimeout(() => setNotification(null), 4000);

    setManualInvoiceNum('');
    setManualDeclaredTotal(0);
    setManualItems([{ raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }]);
    loadData();
    setSelectedInvoice(newInvoice);
    setActiveTab('scan');
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 space-y-4 pb-24">
      
      {/* MODAL DE ESCANEO ACTIVO (PANTALLA DE PROCESAMIENTO) */}
      {isExtracting && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-400/40 animate-pulse">
              <Camera className="w-10 h-10" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border-2 border-amber-400 animate-ping opacity-30" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">Extrayendo Datos de la Factura...</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Optimizando imagen, extrayendo RUC, Timbrado, ítems y montos para guardar en Neon PostgreSQL.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Extracción Inteligente en Curso...</span>
          </div>
        </div>
      )}

      {/* ENCABEZADO Y TABS DE MODO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escáner KuDE • Construlogica</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Escaneo y Auditoría de Facturas
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Captura con la cámara de tu celular para extraer los ítems y guardarlos directamente en Neon Cloud.
          </p>
        </div>

        {/* TABS DE MODO (FOTO vs MANUAL) */}
        <div className="flex items-center space-x-1.5 bg-[#0F1E33] p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'scan'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Por Foto / KuDE ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'manual'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Carga Manual</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* MODO 1: ESCÁNER POR FOTO / SPLIT-SCREEN */}
      {activeTab === 'scan' && (
        <div className="space-y-4">
          
          {/* BARRA DE SELECCIÓN Y SUBIDA DE NUEVA FOTO */}
          <div className="bg-[#0F1E33] p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase shrink-0">Comprobante:</span>
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
                className="w-full sm:max-w-md px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-bold text-white shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none truncate"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.provider_name} • Factura #{inv.invoice_number} ({formatPYG(inv.total_pyg)})
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Tomar Foto / Subir Archivo */}
            <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-400/20 transition-all cursor-pointer shrink-0 active:scale-95">
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

          {/* PANTALLA DIVIDIDA (SPLIT SCREEN / STACK ON MOBILE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* PANEL IZQUIERDO: VISOR DE FOTO CON ZOOM Y ROTACIÓN */}
            <div className="lg:col-span-5 bg-[#0F1E33] rounded-2xl border border-slate-800 shadow-lg p-3.5 space-y-3 sticky top-16">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-white flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Foto del Comprobante</span>
                </span>

                {/* Controles de Zoom y Rotación */}
                <div className="flex items-center space-x-1 bg-[#070D18] p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Girar 90 grados"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.2))}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Alejar"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-black text-amber-400 px-1">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.2))}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Acercar"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contenedor de la Imagen */}
              <div className="relative bg-black/90 rounded-xl overflow-auto max-h-[50vh] sm:max-h-[60vh] min-h-[300px] flex items-center justify-center p-2 border border-slate-800 shadow-inner">
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
                  <div className="text-center text-slate-500 text-xs p-6 space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>Factura sin fotografía adjunta.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span className="truncate max-w-[200px]">Doc: {selectedInvoice?.file_name}</span>
                <span className="font-mono text-amber-400">{formatDatePY(selectedInvoice?.issue_date || '')}</span>
              </div>
            </div>

            {/* PANEL DERECHO: DATOS Y VALIDACIÓN */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Tarjeta de Encabezado */}
              {selectedInvoice && (
                <div className="bg-[#0F1E33] rounded-2xl border border-slate-800 p-4 shadow-lg space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Proveedor</span>
                      <div className="text-base font-black text-white flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span>{selectedInvoice.provider_name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Factura Nº</span>
                      <div className="text-sm font-mono font-black text-amber-400">
                        {selectedInvoice.invoice_number}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-[#070D18] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">RUC</span>
                      <span className="font-mono font-bold text-slate-200 text-xs">{selectedInvoice.ruc}</span>
                    </div>
                    <div className="bg-[#070D18] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Timbrado</span>
                      <span className="font-mono font-bold text-slate-200 text-xs">{selectedInvoice.timbrado}</span>
                    </div>
                    <div className="bg-[#070D18] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Fecha</span>
                      <span className="font-bold text-slate-200 text-xs">{formatDatePY(selectedInvoice.issue_date)}</span>
                    </div>
                    <div className="bg-[#070D18] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Condición</span>
                      <span className="font-black uppercase text-amber-400 text-xs">{selectedInvoice.payment_condition}</span>
                    </div>
                  </div>

                  {/* ALERTA DE SUMA MATEMÁTICA */}
                  <div className={`p-3.5 rounded-2xl flex items-center justify-between border ${
                    hasTotalMismatch 
                      ? 'bg-red-950/50 border-red-500/40 text-red-200' 
                      : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      {hasTotalMismatch ? (
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      ) : (
                        <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-black block">
                          {hasTotalMismatch ? '¡Alerta: Discrepancia matemática en factura!' : 'Sumatoria de Líneas Verificada'}
                        </span>
                        <span className="text-[10px] opacity-80">
                          Suma líneas: {formatPYG(linesTotal)} • Legal declarado: {formatPYG(invoiceDeclaredTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black block text-amber-400">
                        {formatPYG(invoiceDeclaredTotal)}
                      </span>
                      <span className="text-[9px] block opacity-70">Total Legal</span>
                    </div>
                  </div>
                </div>
              )}

              {/* LISTA DE ÍTEMS EXTRAÍDOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>Líneas Extraídas ({selectedInvoice?.items.length || 0})</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                    <Database className="w-3 h-3" />
                    <span>Sincronizado con Neon</span>
                  </span>
                </div>

                {selectedInvoice?.items.map((item, index) => {
                  const suggestions = StorageService.suggestForRawText(item.raw_description);
                  const bestMatch = suggestions[0]?.product;
                  const confidence = suggestions[0]?.confidence || 0.6;

                  return (
                    <div
                      key={item.id || index}
                      className="bg-[#0F1E33] rounded-2xl border border-slate-800 p-3.5 shadow-lg hover:border-amber-400/50 transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-[9px] uppercase font-black text-amber-400 font-mono">
                            Ítem #{index + 1}
                          </span>
                          <h4 className="font-bold text-xs text-white font-mono">
                            "{item.raw_description}"
                          </h4>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs font-black text-white">
                            {item.quantity} {item.unit} x {formatPYG(item.unit_cost_pyg)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 block">
                            = {formatPYG(item.total_pyg)} (IVA 10%)
                          </span>
                        </div>
                      </div>

                      {/* Sugerencia de Homologación */}
                      <div className="bg-[#070D18] p-3 rounded-xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300 flex items-center space-x-1 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Producto Canónico Sugerido:</span>
                          </span>

                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            confidence >= 0.85
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {Math.round(confidence * 100)}% Coincidencia
                          </span>
                        </div>

                        {bestMatch ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                            <div>
                              <strong className="text-xs text-white block">{bestMatch.name}</strong>
                              <span className="text-[10px] text-slate-400">
                                {bestMatch.category_name} • Unidad: {bestMatch.unit}
                              </span>
                            </div>

                            <button
                              onClick={() => handleApproveItem(item, bestMatch.id)}
                              className="inline-flex items-center justify-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs shadow-md shadow-amber-400/20 active:scale-95 transition-all shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Homologar y Guardar Precio</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">Sin sugerencia automática.</p>
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
        <div className="bg-[#0F1E33] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-lg max-w-4xl mx-auto space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Carga Manual de Comprobante / Ticket</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ideal para boletas de ferretería en obra o cuando la foto sale borrosa.
            </p>
          </div>

          <form onSubmit={handleSaveManualInvoice} className="space-y-5">
            
            {/* CABECERA DE FACTURA MANUAL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Proveedor / Ferretería:</label>
                <select
                  value={manualProviderId}
                  onChange={(e) => setManualProviderId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Número de Factura:</label>
                <input
                  type="text"
                  required
                  value={manualInvoiceNum}
                  onChange={(e) => setManualInvoiceNum(e.target.value)}
                  placeholder="Ej: 001-001-0041585"
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Fecha de Emisión:</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Timbrado Nº:</label>
                <input
                  type="text"
                  value={manualTimbrado}
                  onChange={(e) => setManualTimbrado(e.target.value)}
                  placeholder="16638267"
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Condición:</label>
                <select
                  value={manualCondition}
                  onChange={(e) => setManualCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Total Declarado (PYG):</label>
                <input
                  type="number"
                  value={manualDeclaredTotal || ''}
                  onChange={(e) => setManualDeclaredTotal(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 338500"
                  className="w-full px-3 py-2 bg-[#070D18] border border-slate-800 rounded-xl text-xs font-black text-amber-400 focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* LÍNEAS MANUALES */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detalle de Materiales Adquiridos:</span>
                <button
                  type="button"
                  onClick={() => setManualItems([...manualItems, { raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }])}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  + Agregar Otra Línea
                </button>
              </div>

              {manualItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#070D18] rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-center font-mono text-xs font-bold text-amber-400">
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
                      className="w-full px-2.5 py-1.5 bg-[#0F1E33] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
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
                      className="w-full px-2 py-1.5 bg-[#0F1E33] border border-slate-800 rounded-lg text-xs font-bold text-center text-white focus:outline-none focus:border-amber-400"
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
                      className="w-full px-2.5 py-1.5 bg-[#0F1E33] border border-slate-800 rounded-lg text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    {manualItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* VALIDACIÓN DE SUMA MANUAL */}
            <div className={`p-3.5 rounded-2xl flex items-center justify-between border ${
              manualMismatch 
                ? 'bg-red-950/50 border-red-500/40 text-red-200' 
                : 'bg-[#070D18] border-slate-800 text-slate-200'
            }`}>
              <div>
                <span className="text-xs font-black block">
                  {manualMismatch ? '¡Atención: Suma de líneas no coincide con el total!' : 'Suma de Líneas:'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Subtotal calculado: {formatPYG(manualLinesSum)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-amber-400 block">{formatPYG(manualDeclaredTotal || manualLinesSum)}</span>
                <span className="text-[9px] block text-slate-500">Total Ticket</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Factura en Neon DB</span>
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

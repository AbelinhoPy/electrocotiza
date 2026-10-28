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
  Check,
  Plus,
  Key,
  ExternalLink,
  HelpCircle,
  X
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

  // Configuración de Gemini API Key en cliente
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKeyInput, setTempKeyInput] = useState<string>('');
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // Borrador de factura escaneada recientemente (100% editable)
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
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
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

    const savedKey = StorageService.getGeminiApiKey();
    setGeminiApiKey(savedKey);
    setTempKeyInput(savedKey);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveApiKey = () => {
    StorageService.setGeminiApiKey(tempKeyInput);
    setGeminiApiKey(tempKeyInput.trim());
    setShowKeyModal(false);
    setNotification(tempKeyInput.trim() ? '✅ Clave de Gemini guardada correctamente. Tu lector con IA ya está activo.' : 'Clave de Gemini removida.');
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. DISPARADOR AL QUITAR FOTO
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setNotification(null);
    setAiWarning(null);
    setScannedDraft(null);

    try {
      // Comprimir la imagen para rapidez
      const compressedBase64 = await compressImageFile(file);

      // Llamar al endpoint de extracción inteligente con la clave local (si existe)
      let extractedData: any = null;
      let usedMethod = '';
      let warningType = '';

      try {
        const res = await fetch('/api/invoices/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: compressedBase64,
            fileName: file.name,
            apiKey: StorageService.getGeminiApiKey() || undefined,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.invoice) {
            extractedData = json.invoice;
            usedMethod = json.method || '';
            warningType = json.warning || '';
          }
        }
      } catch (err) {
        console.warn('Error en API de extracción:', err);
      }

      if (warningType === 'missing_api_key' || !StorageService.getGeminiApiKey()) {
        setAiWarning('💡 Modo sin IA: Puedes escribir o corregir los materiales y precios directamente aquí abajo. Para que la IA los lea sola desde la foto, vincula tu clave gratuita de Google Gemini.');
      } else if (usedMethod === 'gemini_vision_ai') {
        setNotification('✨ ¡Factura y materiales extraídos con Inteligencia Artificial!');
      }

      // Estructura por defecto si no hubo respuesta o faltan datos
      if (!extractedData) {
        extractedData = {
          provider_name: providers[0]?.name || '',
          ruc: providers[0]?.ruc || '',
          invoice_number: '',
          timbrado: '',
          issue_date: new Date().toISOString().split('T')[0],
          payment_condition: 'contado',
          total_pyg: 0,
          items: [
            {
              raw_description: '',
              quantity: 1,
              unit: 'un',
              unit_cost_pyg: 0,
              total_pyg: 0,
            },
          ],
        };
      }

      const itemsList = (extractedData.items && extractedData.items.length > 0)
        ? extractedData.items
        : [{ raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0, total_pyg: 0 }];

      // Preparar el borrador para que el usuario confirme y EDITE con libertad
      const draft = {
        provider_name: extractedData.provider_name || '',
        ruc: extractedData.ruc || '',
        invoice_number: extractedData.invoice_number || '',
        timbrado: extractedData.timbrado || '',
        issue_date: extractedData.issue_date || new Date().toISOString().split('T')[0],
        payment_condition: (extractedData.payment_condition as any) || 'contado',
        total_pyg: extractedData.total_pyg || 0,
        items: itemsList.map((it: any) => {
          const suggestions = StorageService.suggestForRawText(it.raw_description || '');
          const best = suggestions[0]?.product;
          const qty = Number(it.quantity) || 1;
          const cost = Number(it.unit_cost_pyg) || 0;
          return {
            raw_description: it.raw_description || '',
            quantity: qty,
            unit: it.unit || 'un',
            unit_cost_pyg: cost,
            total_pyg: Number(it.total_pyg) || (qty * cost),
            suggested_canonical_id: best?.id,
          };
        }),
      };

      // Si el total es 0, recalcular de la suma de ítems
      const sumItems = draft.items.reduce((acc: number, it: any) => acc + (it.total_pyg || 0), 0);
      if (draft.total_pyg === 0 && sumItems > 0) {
        draft.total_pyg = sumItems;
      }

      setScannedDraft(draft);
    } catch (err: any) {
      setNotification(`Error al procesar imagen: ${err.message || 'Error'}`);
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  // MANIPULACIÓN DEL BORRADOR ESCANEADO (EDICIÓN EN VIVO)
  const handleUpdateDraftItem = (index: number, field: string, value: any) => {
    if (!scannedDraft) return;
    const newItems = [...scannedDraft.items];
    const item = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_cost_pyg') {
      const qty = Number(field === 'quantity' ? value : item.quantity) || 1;
      const cost = Number(field === 'unit_cost_pyg' ? value : item.unit_cost_pyg) || 0;
      item.total_pyg = qty * cost;
    }

    if (field === 'raw_description') {
      const suggestions = StorageService.suggestForRawText(value || '');
      item.suggested_canonical_id = suggestions[0]?.product?.id;
    }

    newItems[index] = item;
    const newTotal = newItems.reduce((acc, it) => acc + (it.total_pyg || 0), 0);

    setScannedDraft({
      ...scannedDraft,
      items: newItems,
      total_pyg: newTotal,
    });
  };

  const handleAddDraftItem = () => {
    if (!scannedDraft) return;
    setScannedDraft({
      ...scannedDraft,
      items: [
        ...scannedDraft.items,
        {
          raw_description: '',
          quantity: 1,
          unit: 'un',
          unit_cost_pyg: 0,
          total_pyg: 0,
        },
      ],
    });
  };

  const handleRemoveDraftItem = (index: number) => {
    if (!scannedDraft) return;
    const newItems = scannedDraft.items.filter((_, idx) => idx !== index);
    const finalItems = newItems.length > 0 ? newItems : [
      { raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0, total_pyg: 0 }
    ];
    const newTotal = finalItems.reduce((acc, it) => acc + (it.total_pyg || 0), 0);
    setScannedDraft({
      ...scannedDraft,
      items: finalItems,
      total_pyg: newTotal,
    });
  };

  // 2. CONFIRMAR Y GUARDAR FACTURA EXTRAÍDA POR FOTO
  const handleConfirmScannedDraft = async () => {
    if (!scannedDraft) return;

    const finalInvoiceNumber = scannedDraft.invoice_number.trim() || `001-001-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const finalProviderName = scannedDraft.provider_name.trim() || 'Ferretería / Proveedor Local';

    const matchedProvider = providers.find(p => 
      p.name.toLowerCase().includes(finalProviderName.toLowerCase()) ||
      (p.ruc && p.ruc === scannedDraft.ruc)
    ) || providers[0];

    const validItems = scannedDraft.items.filter(it => it.raw_description.trim().length > 0);
    const itemsToSave = validItems.length > 0 ? validItems : scannedDraft.items;

    const calculatedTotal = itemsToSave.reduce((acc, it) => acc + (it.total_pyg || 0), 0);
    const finalTotal = scannedDraft.total_pyg > 0 ? scannedDraft.total_pyg : calculatedTotal;

    const newInvoice: IngestedInvoice = {
      id: `inv-custom-${Date.now()}`,
      provider_id: matchedProvider?.id || 'prov-custom',
      provider_name: finalProviderName,
      invoice_number: finalInvoiceNumber,
      timbrado: scannedDraft.timbrado.trim() || '18000000',
      ruc: scannedDraft.ruc.trim() || matchedProvider?.ruc || '80000000-0',
      issue_date: scannedDraft.issue_date,
      payment_condition: scannedDraft.payment_condition,
      subtotal_pyg: finalTotal,
      iva_10_pyg: Math.round(finalTotal / 11),
      total_pyg: finalTotal,
      file_url: '', // Cero fotos pesadas: 100% datos estructurados
      file_name: `Factura ${finalInvoiceNumber}`,
      status: 'approved',
      created_at: new Date().toISOString(),
      items: itemsToSave.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        raw_description: it.raw_description.trim() || 'Material Eléctrico',
        quantity: it.quantity || 1,
        unit: it.unit || 'un',
        unit_cost_pyg: it.unit_cost_pyg || 0,
        iva_rate: 10,
        total_pyg: it.total_pyg || 0,
        suggested_canonical_id: it.suggested_canonical_id,
        is_confirmed: true,
      })),
    };

    // Guardar en Storage Local
    StorageService.saveInvoice(newInvoice);

    // Guardar precios en el catálogo maestro
    newInvoice.items.forEach(it => {
      if (it.suggested_canonical_id && it.unit_cost_pyg > 0) {
        StorageService.recordPrice(it.suggested_canonical_id, {
          canonical_product_id: it.suggested_canonical_id,
          provider_id: newInvoice.provider_id,
          provider_name: newInvoice.provider_name,
          price_pyg: it.unit_cost_pyg,
          currency: 'PYG',
          includes_iva: true,
          iva_rate_pct: 10,
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

    setNotification(`✅ Factura ${newInvoice.invoice_number} de ${newInvoice.provider_name} guardada exitosamente.`);
    setScannedDraft(null);
    setAiWarning(null);
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

    // Actualizar catálogo
    newInvoice.items.forEach(it => {
      if (it.suggested_canonical_id && it.unit_cost_pyg > 0) {
        StorageService.recordPrice(it.suggested_canonical_id, {
          canonical_product_id: it.suggested_canonical_id,
          provider_id: newInvoice.provider_id,
          provider_name: newInvoice.provider_name,
          price_pyg: it.unit_cost_pyg,
          currency: 'PYG',
          includes_iva: true,
          iva_rate_pct: 10,
          date: newInvoice.issue_date,
          source_type: 'manual',
          source_ref: `Factura ${newInvoice.invoice_number}`,
          notes: 'Carga manual',
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

    setNotification(`✅ Factura ${newInvoice.invoice_number} guardada exitosamente.`);
    setManualInvoiceNum('');
    setManualItems([{ raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }]);
    setManualDeclaredTotal(0);
    loadData();
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
      
      {/* CABECERA MÓVIL DIRECTA */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Ingreso de Facturas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Cargar Factura de Compra
          </h1>
        </div>

        {/* BOTÓN RÁPIDO PARA IA / GEMINI */}
        <button
          onClick={() => setShowKeyModal(true)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
            geminiApiKey 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>{geminiApiKey ? 'IA Activa' : 'Activar IA Gratis'}</span>
        </button>
      </div>

      {/* NOTIFICACIÓN ÉXITO */}
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
            setAiWarning(null);
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
            setAiWarning(null);
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
                disabled={isExtracting}
              />
              <div className="bg-[#0F1E33] hover:bg-[#132742] border-2 border-dashed border-amber-400/40 hover:border-amber-400 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                {isExtracting ? (
                  <div className="py-6 space-y-3">
                    <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-white">Leyendo ticket con Visión Inteligente...</p>
                    <p className="text-xs text-slate-400">Extrayendo proveedor, timbrado, materiales y precios...</p>
                  </div>
                ) : (
                  <>
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
                      <span>📸 Quitar foto o seleccionar imagen</span>
                    </div>
                  </>
                )}
              </div>
            </label>
          ) : (
            /* SI YA ESCANEÓ: VISTA EDITABLE Y FÁCIL PARA CONFIRMAR ANTES DE GUARDAR */
            <div className="bg-[#0F1E33] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in">
              
              {/* ALERTA INFORMATIVA SI NO HAY IA VINCULADA */}
              {aiWarning && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <span>{aiWarning}</span>
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(true)}
                        className="text-amber-400 underline font-bold text-[11px] hover:text-white"
                      >
                        🔑 Vincular clave gratuita de Google Gemini aquí
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ENCABEZADO DE DATOS BÁSICOS EDITABLES */}
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    Datos de la Factura
                  </span>
                  <input
                    type="text"
                    value={scannedDraft.provider_name}
                    onChange={(e) => setScannedDraft({ ...scannedDraft, provider_name: e.target.value })}
                    placeholder="Proveedor / Ferretería"
                    className="bg-[#070D18] border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold text-xs mt-1 w-full focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="text-right pl-3">
                  <span className="text-[10px] text-slate-400 font-bold block">Total Factura</span>
                  <span className="text-base font-black text-amber-400">
                    {formatPYG(scannedDraft.total_pyg)}
                  </span>
                </div>
              </div>

              {/* DETALLES DE COMPROBANTE */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Factura Nº</label>
                  <input
                    type="text"
                    value={scannedDraft.invoice_number}
                    onChange={(e) => setScannedDraft({ ...scannedDraft, invoice_number: e.target.value })}
                    placeholder="001-001-0012345"
                    className="w-full bg-[#070D18] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={scannedDraft.issue_date}
                    onChange={(e) => setScannedDraft({ ...scannedDraft, issue_date: e.target.value })}
                    className="w-full bg-[#070D18] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* LÍNEAS DE MATERIALES (100% EDITABLES) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Materiales ({scannedDraft.items.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDraftItem}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Material</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {scannedDraft.items.map((it, idx) => (
                    <div key={idx} className="bg-[#070D18] border border-slate-800 p-2.5 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={it.raw_description}
                          onChange={(e) => handleUpdateDraftItem(idx, 'raw_description', e.target.value)}
                          placeholder="Descripción del material (ej: Cable 2.0 mm2, Llave 20A...)"
                          className="flex-1 bg-[#0F1E33] border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold text-xs focus:border-amber-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftItem(idx)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => handleUpdateDraftItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full bg-[#0F1E33] border border-slate-800 rounded-xl px-2 py-1 text-white text-xs text-center focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Precio Unit. (₲)</label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={it.unit_cost_pyg}
                            onChange={(e) => handleUpdateDraftItem(idx, 'unit_cost_pyg', Number(e.target.value))}
                            className="w-full bg-[#0F1E33] border border-slate-800 rounded-xl px-2 py-1 text-amber-400 font-bold text-xs text-right focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Subtotal (₲)</label>
                          <div className="h-7 bg-[#0F1E33] border border-slate-800 rounded-xl px-2 flex items-center justify-end text-white font-black text-xs">
                            {formatPYG(it.total_pyg)}
                          </div>
                        </div>
                      </div>
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
                  onClick={() => {
                    setScannedDraft(null);
                    setAiWarning(null);
                  }}
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
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Proveedor / Ferretería</label>
              <select
                value={manualProviderId}
                onChange={(e) => setManualProviderId(e.target.value)}
                className="w-full bg-[#070D18] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nº Comprobante</label>
                <input
                  type="text"
                  required
                  placeholder="001-001-0012345"
                  value={manualInvoiceNum}
                  onChange={(e) => setManualInvoiceNum(e.target.value)}
                  className="w-full bg-[#070D18] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-[#070D18] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* ÍTEMS MANUALES */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Materiales</span>
                <button
                  type="button"
                  onClick={() => setManualItems([...manualItems, { raw_description: '', quantity: 1, unit: 'un', unit_cost_pyg: 0 }])}
                  className="text-amber-400 text-xs font-bold hover:underline"
                >
                  + Agregar Ítem
                </button>
              </div>

              {manualItems.map((item, idx) => (
                <div key={idx} className="bg-[#070D18] border border-slate-800 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Descripción del material"
                      value={item.raw_description}
                      onChange={(e) => {
                        const next = [...manualItems];
                        next[idx].raw_description = e.target.value;
                        setManualItems(next);
                      }}
                      className="flex-1 bg-[#0F1E33] border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                    {manualItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...manualItems];
                        next[idx].quantity = Number(e.target.value);
                        setManualItems(next);
                      }}
                      className="bg-[#0F1E33] border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-400 focus:outline-none"
                    />

                    <input
                      type="number"
                      min="0"
                      step="500"
                      placeholder="Precio Unitario (₲)"
                      value={item.unit_cost_pyg || ''}
                      onChange={(e) => {
                        const next = [...manualItems];
                        next[idx].unit_cost_pyg = Number(e.target.value);
                        setManualItems(next);
                      }}
                      className="bg-[#0F1E33] border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-400 focus:outline-none text-right font-mono"
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

      {/* HISTORIAL PLEGABLE (NO ESTORBA) */}
      <div className="pt-2">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0F1E33] border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all"
        >
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Facturas guardadas anteriormente ({invoices.length})</span>
          </div>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1 animate-in fade-in">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-[#0F1E33] border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 mr-2">
                  <span className="font-black text-white block truncate">{inv.provider_name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Nº {inv.invoice_number} • {formatDatePY(inv.issue_date)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-amber-400 block text-xs">
                    {formatPYG(inv.total_pyg)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {inv.items.length} materiales
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CONFIGURACIÓN GEMINI API KEY */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0F1E33] border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">Lector Inteligente con IA</h3>
              </div>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Para que la cámara lea automáticamente los nombres de materiales, cantidades y precios en guaraníes, ingresa tu clave gratuita de <strong className="text-amber-400">Google Gemini API</strong>:
              </p>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  className="w-full bg-[#070D18] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1 text-amber-400 font-bold">
                  <ExternalLink className="w-3 h-3" />
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    Obtener clave gratis en Google AI Studio ↗
                  </a>
                </div>
                <p>Es 100% gratuita con cualquier cuenta de Google.</p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all"
                >
                  Guardar Clave
                </button>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

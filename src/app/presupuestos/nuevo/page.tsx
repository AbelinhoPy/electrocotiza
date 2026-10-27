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
  CheckCircle2, 
  Sparkles,
  Zap,
  Clock,
  Truck,
  Calendar,
  Layers,
  ShieldAlert,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Copy,
  Info,
  DollarSign,
  AlertTriangle,
  Lock,
  Share2
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { 
  Budget, 
  BudgetItem, 
  CanonicalProduct, 
  Client, 
  CompanySettings, 
  EquipmentItem, 
  QuoteGroup, 
  LaborLine, 
  LogisticsLine, 
  ScheduleTask, 
  UserProfile, 
  UserPermissions,
  CatalogService 
} from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale } from '@/lib/utils';
import { PricingEngine } from '@/lib/pricing-engine';
import { 
  generateClientPDF, 
  generateMaterialsListPDF, 
  generatePriceListPDF, 
  generateInternalCostSummaryPDF 
} from '@/lib/export/pdf-generator';

const WIZARD_STEPS = [
  { step: 1, title: 'Datos Generales', icon: FileCheck },
  { step: 2, title: 'Equipos / Cargas', icon: Zap },
  { step: 3, title: 'Materiales & Grupos', icon: Layers },
  { step: 4, title: 'Precios & Proveedores', icon: DollarSign },
  { step: 5, title: 'Mano de Obra', icon: Wrench },
  { step: 6, title: 'Logística', icon: Truck },
  { step: 7, title: 'Cronograma', icon: Calendar },
  { step: 8, title: 'Resumen & Emisión', icon: CheckCircle2 },
];

export default function NuevoPresupuestoPage() {
  const router = useRouter();

  // Permisos y Usuario Activo
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(StorageService.getUserPermissions(null));
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());
  
  // Paso actual del Asistente
  const [activeStep, setActiveStep] = useState(1);

  // Datos del Negocio
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);

  // 1. Datos Generales
  const [budgetNumber, setBudgetNumber] = useState('');
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [currency, setCurrency] = useState<'PYG' | 'USD'>('PYG');
  const [exchangeRate, setExchangeRate] = useState(7950);
  const [globalMargin, setGlobalMargin] = useState(30);
  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('margin');
  const [ivaRate, setIvaRate] = useState(10);
  const [validityDays, setValidityDays] = useState(15);
  const [deliveryTerms, setDeliveryTerms] = useState('Inmediato / Según avance de obra');
  const [paymentTerms, setPaymentTerms] = useState('Anticipo 30%, 40% contra entrega de tableros, 30% contra recepción final');
  const [salespersonName, setSalespersonName] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [publicNotes, setPublicNotes] = useState('');

  // 2. Equipos / Cargas
  const [equipments, setEquipments] = useState<EquipmentItem[]>([
    {
      id: 'eq-1',
      name: 'Tablero General de Distribución (TGD)',
      quantity: 1,
      location: 'Sala Eléctrica Principal',
      technical_specs: '380V Trifásico 50Hz, Capacidad 160A con interruptor caja moldeada y derivaciones seccionales.',
      notes: 'Requiere barraje de cobre electrolítico normalizado.',
    }
  ]);

  // 3. Subgrupos e Ítems
  const [subgroups, setSubgroups] = useState<QuoteGroup[]>([
    { id: 'grp-1', name: 'Tablero General y Protecciones', order: 1, items: [] },
    { id: 'grp-2', name: 'Alimentadores y Canalizaciones', order: 2, items: [] },
    { id: 'grp-3', name: 'Puesta a Tierra y Pararrayos', order: 3, items: [] },
  ]);
  const [items, setItems] = useState<BudgetItem[]>([]);

  // 4. Mano de Obra
  const [laborLines, setLaborLines] = useState<LaborLine[]>([
    {
      id: 'lab-1',
      method: 'man_hours',
      technician_category: 'Oficial Electricista Industrial',
      hourly_rate_pyg: 55000,
      hours_per_worker: 16,
      worker_count: 2,
      service_description: 'Montaje de tablero, peinado de cables y conexionado de borneras',
      total_pyg: 1760000,
      is_included_in_quote: true,
      covered_by_other_concept: false,
    }
  ]);

  // 5. Logística
  const [logisticsLines, setLogisticsLines] = useState<LogisticsLine[]>([
    {
      id: 'log-1',
      concept_type: 'km_mobility',
      description: 'Movilidad cuadrilla técnica (Asunción - Obra)',
      calculation_type: 'per_km',
      quantity: 80,
      unit: 'km',
      unit_rate_pyg: 2500,
      cost_pyg: 200000,
      margin_pct: 0,
      sale_price_pyg: 200000,
      is_included_in_quote: true,
    }
  ]);

  // 6. Cronograma
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([
    {
      id: 'tsk-1',
      title: 'Tendido de canalizaciones y cañerías embutidas',
      assigned_to: 'Ramón Fleitas',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      estimated_hours: 24,
      workers_count: 2,
      progress_pct: 0,
      status: 'pending',
    }
  ]);

  // Modales y Estados Auxiliares
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [activeSubgroupIdForAdd, setActiveSubgroupIdForAdd] = useState<string>('grp-1');
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [filterPriceStatus, setFilterPriceStatus] = useState<'all' | 'priced' | 'unpriced' | 'stale'>('all');
  
  // Solicitud de Descuento
  const [discountModalItem, setDiscountModalItem] = useState<BudgetItem | null>(null);
  const [discountInputPct, setDiscountInputPct] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');

  // Modal Nuevo Cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientRuc, setNewClientRuc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('Asunción');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Estado de Emisión y Guardado
  const [isSaving, setIsSaving] = useState(false);
  const [savedBudget, setSavedBudget] = useState<Budget | null>(null);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [copiedSipap, setCopiedSipap] = useState(false);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setPermissions(StorageService.getUserPermissions(user));

    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);
    setGlobalMargin(loadedSettings.default_margin_pct || 30);
    setPricingMethod(loadedSettings.pricing_method || 'margin');
    setExchangeRate(loadedSettings.exchange_rate_usd_pyg || 7950);
    setIvaRate(loadedSettings.default_iva_rate_pct || 10);
    setValidityDays(loadedSettings.pdf_validez_dias || 15);
    setDeliveryTerms(loadedSettings.pdf_plazo_entrega_defecto || 'Inmediato / Según avance de obra');
    setPaymentTerms(loadedSettings.pdf_condicion_pago_defecto || 'A convenir / Contra entrega o transferencia bancaria');
    setSalespersonName(user?.full_name || 'Ing. Lucas Duré');

    const loadedClients = StorageService.getClients();
    setClients(loadedClients);
    if (loadedClients.length > 0) {
      setSelectedClientId(loadedClients[0].id);
    }

    const prods = StorageService.getProducts();
    setProducts(prods);

    const srvs = StorageService.getServices();
    setServices(srvs);

    // Generar número comercial correlativo PRES-AAAA-NNNN
    const allBudgets = StorageService.getBudgets();
    const nextNumber = PricingEngine.generateQuoteNumber(allBudgets);
    setBudgetNumber(nextNumber);

    // Cargar ítems de demostración iniciales para que el usuario pueda probar de inmediato
    if (prods.length > 0) {
      const p1 = prods.find(p => p.sku === 'TERM-ABB-3X63') || prods[0];
      const p2 = prods.find(p => p.sku === 'BARRA-CU-20X3') || prods[1];
      const initialItems: BudgetItem[] = [
        {
          id: `bi-${Date.now()}-1`,
          subgroup_id: 'grp-1',
          hierarchical_number: '1.1',
          canonical_product_id: p1.id,
          provider_id: p1.history?.[0]?.provider_id,
          provider_name: p1.last_provider_name || 'ABB Paraguay',
          item_type: 'material',
          description: p1.name,
          brand: p1.brand,
          quantity: 2,
          unit: p1.unit,
          unit_estimated_time_hours: 1.5,
          total_estimated_time_hours: 3.0,
          unit_cost_pyg: p1.last_price_pyg || 245000,
          margin_pct: 30,
          discount_pct: 0,
          unit_sale_pyg: PricingEngine.calculateSalePriceFromMargin(p1.last_price_pyg || 245000, 30),
          total_sale_pyg: PricingEngine.calculateSalePriceFromMargin(p1.last_price_pyg || 245000, 30) * 2,
          position: 1,
        },
        {
          id: `bi-${Date.now()}-2`,
          subgroup_id: 'grp-1',
          hierarchical_number: '1.2',
          canonical_product_id: p2.id,
          provider_id: p2.history?.[0]?.provider_id,
          provider_name: p2.last_provider_name || 'ENERLUZ S.A.',
          item_type: 'material',
          description: p2.name,
          brand: p2.brand,
          quantity: 4,
          unit: p2.unit,
          unit_estimated_time_hours: 0.8,
          total_estimated_time_hours: 3.2,
          unit_cost_pyg: p2.last_price_pyg || 82500,
          margin_pct: 30,
          discount_pct: 0,
          unit_sale_pyg: PricingEngine.calculateSalePriceFromMargin(p2.last_price_pyg || 82500, 30),
          total_sale_pyg: PricingEngine.calculateSalePriceFromMargin(p2.last_price_pyg || 82500, 30) * 4,
          position: 2,
        }
      ];
      setItems(initialItems);
    }
  }, []);

  // Construcción del objeto Quote temporal para cálculos reactivos
  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0] || {
    id: 'cli-temp',
    name: 'Cliente Particular',
    ruc_or_ci: 'Sin especificar',
    phone: '',
    email: '',
    city: 'Asunción',
    address: 'En obra',
    is_active: true,
  };

  const currentQuoteSnapshot: Partial<Budget> = {
    budget_number: budgetNumber,
    title: title || 'Montaje e Instalación Eléctrica Industrial',
    client: currentClient,
    currency,
    global_margin_pct: globalMargin,
    pricing_method: pricingMethod,
    items,
    labor_lines: laborLines,
    logistics_lines: logisticsLines,
  };

  // Cálculo de totales mediante el Motor Centralizado
  const totals = PricingEngine.calculateQuoteTotals(currentQuoteSnapshot, ivaRate);

  // Tiempo técnico total estimado de ingeniería
  const totalEstimatedHours = items.reduce((acc, it) => acc + (it.total_estimated_time_hours || 0), 0);

  // --- ACCIONES DE MATERIALES ---
  const handleAddMaterialToSubgroup = (prod: CanonicalProduct) => {
    const cost = prod.last_price_pyg || 0;
    const margin = globalMargin;
    const unitSale = PricingEngine.calculateSalePriceFromMargin(cost, margin);

    const targetSubgroup = subgroups.find(s => s.id === activeSubgroupIdForAdd) || subgroups[0];
    const subgroupItems = items.filter(i => i.subgroup_id === targetSubgroup.id);
    const itemIndex = subgroupItems.length + 1;
    const hierNum = `${subgroups.indexOf(targetSubgroup) + 1}.${itemIndex}`;

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${items.length + 1}`,
      subgroup_id: targetSubgroup.id,
      hierarchical_number: hierNum,
      canonical_product_id: prod.id,
      provider_id: prod.history?.[0]?.provider_id,
      provider_name: prod.last_provider_name || 'Proveedor General',
      item_type: 'material',
      description: prod.name,
      brand: prod.brand,
      quantity: 1,
      unit: prod.unit,
      unit_estimated_time_hours: 0.5,
      total_estimated_time_hours: 0.5,
      unit_cost_pyg: cost,
      margin_pct: margin,
      discount_pct: 0,
      unit_sale_pyg: unitSale,
      total_sale_pyg: unitSale,
      position: items.length + 1,
    };

    setItems([...items, newItem]);
    setShowItemPicker(false);
  };

  const handleUpdateItem = (itemId: string, patch: Partial<BudgetItem>) => {
    setItems(items.map(it => {
      if (it.id !== itemId) return it;
      const updated = { ...it, ...patch };

      // Recalcular tiempo
      if (patch.quantity !== undefined || patch.unit_estimated_time_hours !== undefined) {
        updated.total_estimated_time_hours = Number(((updated.quantity || 1) * (updated.unit_estimated_time_hours || 0)).toFixed(1));
      }

      // Recalcular venta si cambia costo o margen o descuento
      if (patch.unit_cost_pyg !== undefined || patch.margin_pct !== undefined || patch.discount_pct !== undefined) {
        const cost = updated.unit_cost_pyg;
        const margin = updated.margin_pct;
        const beforeDisc = PricingEngine.calculateSalePriceFromMargin(cost, margin);
        const finalUnit = PricingEngine.calculateFinalPrice(beforeDisc, updated.discount_pct || 0);
        updated.unit_sale_pyg = finalUnit;
      }

      updated.total_sale_pyg = updated.unit_sale_pyg * (updated.quantity || 1);
      return updated;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(it => it.id !== itemId));
  };

  // --- APLICACIÓN Y VALIDACIÓN DE DESCUENTO ---
  const openDiscountModal = (item: BudgetItem) => {
    setDiscountModalItem(item);
    setDiscountInputPct(item.discount_pct || 0);
    setDiscountReason('');
  };

  const handleApplyDiscount = () => {
    if (!discountModalItem) return;
    const validation = PricingEngine.validateDiscount(
      discountModalItem.unit_cost_pyg,
      PricingEngine.calculateSalePriceFromMargin(discountModalItem.unit_cost_pyg, discountModalItem.margin_pct),
      discountInputPct,
      settings.max_unapproved_discount_pct || 20
    );

    if (!validation.allowed) {
      alert(validation.message);
      return;
    }

    if (validation.requiresApproval && !permissions.canApproveDiscounts) {
      const confirmRequest = confirm(
        `${validation.message}\n¿Deseas enviar una Solicitud de Aprobación de Descuento al Administrador?`
      );
      if (confirmRequest) {
        handleUpdateItem(discountModalItem.id, { discount_pct: discountInputPct });
        alert('Descuento asignado condicionalmente. El presupuesto quedará en estado "Pendiente de Autorización".');
      }
    } else {
      handleUpdateItem(discountModalItem.id, { discount_pct: discountInputPct });
    }

    setDiscountModalItem(null);
  };

  // --- GUARDADO / EMISIÓN FINAL ---
  const handleSaveBudget = (status: 'draft' | 'sent' = 'draft') => {
    if (!title.trim()) {
      alert('Por favor ingresa un título o nombre para el presupuesto.');
      setActiveStep(1);
      return;
    }

    if (status === 'sent' && totals.hasUnpricedItems) {
      alert(`No se puede emitir el presupuesto porque tiene ${totals.unpricedItemsCount} ítem(s) sin precio asignado. Por favor asígnales precio o márcalos como suministrados por el cliente.`);
      setActiveStep(4);
      return;
    }

    setIsSaving(true);
    const newBudget: Budget = {
      id: `b-${Date.now()}`,
      budget_number: budgetNumber,
      title: title.trim(),
      project_name: projectName.trim() || title.trim(),
      client: currentClient,
      status: status,
      is_archived: false,
      version: 1,
      current_revision: status === 'sent' ? 1 : 0,
      revisions: [],
      currency,
      exchange_rate_usd_pyg: exchangeRate,
      default_iva_rate_pct: ivaRate,
      global_margin_pct: globalMargin,
      pricing_method: pricingMethod,
      total_materials_cost_pyg: totals.totalMaterialsCost,
      total_materials_sale_pyg: totals.totalMaterialsSale,
      total_labor_sale_pyg: totals.totalLaborSale,
      total_logistics_sale_pyg: totals.totalLogisticsSale,
      total_other_sale_pyg: totals.totalOtherSale,
      total_discount_amount_pyg: totals.totalDiscountAmount,
      subtotal_net_pyg: totals.subtotalNet,
      iva_amount_pyg: totals.ivaAmount,
      total_cost_pyg: totals.totalCost,
      total_sale_pyg: totals.totalSale,
      estimated_profit_pyg: totals.estimatedProfit,
      profit_margin_pct: totals.profitMarginPct,
      validity_days: validityDays,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      salesperson_name: salespersonName,
      internal_notes: internalNotes,
      notes: publicNotes,
      suggested_price_strategy: 'last_price',
      equipments,
      subgroups,
      items,
      labor_lines: laborLines,
      logistics_lines: logisticsLines,
      schedule_tasks: scheduleTasks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      newBudget.revisions.push({
        revision_number: 1,
        created_at: new Date().toISOString(),
        created_by_name: currentUser?.full_name || 'Presupuestista',
        total_sale_pyg: totals.totalSale,
        total_cost_pyg: totals.totalCost,
        subtotal_net_pyg: totals.subtotalNet,
        iva_amount_pyg: totals.ivaAmount,
        summary_notes: 'Primera emisión oficial aprobada',
        snapshot_data: JSON.parse(JSON.stringify(newBudget)),
      });
    }

    StorageService.saveBudget(newBudget);
    setSavedBudget(newBudget);
    setIsSaving(false);

    if (status === 'sent') {
      alert(`¡Presupuesto ${newBudget.budget_number} emitido exitosamente como Revisión 1!`);
    } else {
      alert(`Presupuesto ${newBudget.budget_number} guardado como Borrador.`);
    }
  };

  // --- GENERACIÓN DE LOS 4 DOCUMENTOS PDF ---
  const handleDownloadPDF = async (type: 'client' | 'materials' | 'pricelist' | 'internal') => {
    try {
      setDownloadingType(type);
      const budgetForExport = savedBudget || {
        ...currentQuoteSnapshot,
        id: `temp-${Date.now()}`,
        status: 'draft',
        is_archived: false,
        version: 1,
        current_revision: 1,
        revisions: [],
        total_materials_cost_pyg: totals.totalMaterialsCost,
        total_materials_sale_pyg: totals.totalMaterialsSale,
        total_labor_sale_pyg: totals.totalLaborSale,
        total_logistics_sale_pyg: totals.totalLogisticsSale,
        total_other_sale_pyg: 0,
        total_discount_amount_pyg: totals.totalDiscountAmount,
        subtotal_net_pyg: totals.subtotalNet,
        iva_amount_pyg: totals.ivaAmount,
        total_cost_pyg: totals.totalCost,
        total_sale_pyg: totals.totalSale,
        estimated_profit_pyg: totals.estimatedProfit,
        profit_margin_pct: totals.profitMarginPct,
        validity_days: validityDays,
        delivery_terms: deliveryTerms,
        payment_terms: paymentTerms,
        salesperson_name: salespersonName,
        notes: publicNotes,
        internal_notes: internalNotes,
        suggested_price_strategy: 'last_price',
        equipments,
        subgroups,
        items,
        labor_lines: laborLines,
        logistics_lines: logisticsLines,
        schedule_tasks: scheduleTasks,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Budget;

      let doc;
      let filename = '';

      if (type === 'client') {
        doc = await generateClientPDF(budgetForExport, settings);
        filename = `Presupuesto_${budgetNumber}_${currentClient.name.replace(/\s+/g, '_')}.pdf`;
      } else if (type === 'materials') {
        doc = await generateMaterialsListPDF(budgetForExport, settings);
        filename = `Lista_Materiales_${budgetNumber}_Panol.pdf`;
      } else if (type === 'pricelist') {
        doc = await generatePriceListPDF(budgetForExport, settings);
        filename = `Lista_Precios_${budgetNumber}_Comercial.pdf`;
      } else if (type === 'internal') {
        if (!permissions.canViewCosts) {
          alert('No tienes permiso para generar la hoja de costos internos.');
          return;
        }
        doc = await generateInternalCostSummaryPDF(budgetForExport, settings);
        filename = `Resumen_Costos_Rentabilidad_${budgetNumber}_CONFIDENCIAL.pdf`;
      }

      if (doc) {
        doc.save(filename);
      }
    } catch (err) {
      console.error('Error al generar PDF', err);
      alert('Ocurrió un error al generar el documento PDF.');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*PRESUPUESTO ELÉCTRICO* ⚡\n*Construlogica Emprendimientos S.A.*\n\n*Cliente:* ${currentClient.name}\n*Comprobante:* ${budgetNumber}\n*Total:* ${formatPYG(totals.totalSale)} (IVA 10% incluido)\n*Validez:* ${validityDays} días\n\n_Generado profesionalmente por el Sistema Comercial._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopySipap = () => {
    const text = `*DATOS PARA TRANSFERENCIA BANCARIA SIPAP*\nEmpresa: ${settings.company_name}\nRUC: ${settings.ruc}\nBanco: ${settings.bank_name}\nCta Cte: ${settings.bank_account_number}\nAlias SIPAP: ${settings.bank_sipap_alias}`;
    navigator.clipboard.writeText(text);
    setCopiedSipap(true);
    setTimeout(() => setCopiedSipap(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* BARRA SUPERIOR CON ACCIONES RÁPIDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href="/presupuestos" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-200">
                {budgetNumber}
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
                Borrador Técnico
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {title || 'Nuevo Presupuesto Eléctrico'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSaveBudget('draft')}
            disabled={isSaving}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Guardar Borrador</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveBudget('sent')}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Emitir Revisión Oficial</span>
          </button>
        </div>
      </div>

      {/* ASISTENTE NUMERADO CONSECUTIVO DE 8 ETAPAS */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {WIZARD_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.step;
            const isCompleted = activeStep > s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-blue-900 text-white shadow-sm' 
                    : isCompleted 
                    ? 'text-emerald-700 hover:bg-emerald-50' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isActive 
                    ? 'bg-amber-400 text-slate-950' 
                    : isCompleted 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isCompleted ? '✓' : s.step}
                </div>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DEL PASO 1: DATOS GENERALES */}
      {activeStep === 1 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-blue-700" />
              <span>Paso 1: Datos Comerciales y Generales del Presupuesto</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Define cliente, proyecto, plazos y condiciones comerciales vigentes en Paraguay.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número Comercial</label>
              <input
                type="text"
                readOnly
                value={budgetNumber}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-lg text-slate-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Título del Presupuesto *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Adecuación y Montaje de Tableros CCM Planta Frigorífico"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Nuevo</span>
                </button>
              </div>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.ruc_or_ci || 'S/ RUC'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Proyecto / Obra</label>
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Ej: Nave B - Automatización de Motores"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vendedor / Responsable</label>
              <input
                type="text"
                value={salespersonName}
                onChange={e => setSalespersonName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Moneda Principal</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as 'PYG' | 'USD')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="PYG">Guaraníes (PYG ₲) - Moneda Nacional</option>
                <option value="USD">Dólares Americanos (USD $)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cotización USD / Gs.</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={e => setExchangeRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Validez de Oferta (Días)</label>
              <input
                type="number"
                value={validityDays}
                onChange={e => setValidityDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Plazo de Entrega (Días Hábiles)</label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={e => setDeliveryTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Condición y Forma de Pago</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Notas Visibles en Presupuesto (Para el Cliente)</label>
              <textarea
                rows={2}
                value={publicNotes}
                onChange={e => setPublicNotes(e.target.value)}
                placeholder="Observaciones técnicas, garantías, exclusiones acordadas..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {permissions.canViewCosts && (
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Notas Internas Confidenciales (No visibles en PDF Comercial)</span>
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Márgenes acordados con el proveedor, condiciones de crédito de compra, detalles de negociación..."
                  className="w-full px-3 py-2 text-xs border border-amber-200 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 2: EQUIPOS O ACCIONAMIENTOS */}
      {activeStep === 2 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Paso 2: Registro Descriptivo de Equipos y Accionamientos</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Inventario técnico de tableros, transformadores, compresores y motores a alimentar.</p>
            </div>
            <button
              type="button"
              onClick={() => setEquipments([
                ...equipments,
                { id: `eq-${Date.now()}`, name: '', quantity: 1, location: '', technical_specs: '' }
              ])}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center space-x-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Equipo</span>
            </button>
          </div>

          <div className="space-y-3">
            {equipments.map((eq, idx) => (
              <div key={eq.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre / Tipo de Equipo #{idx + 1}</label>
                  <input
                    type="text"
                    value={eq.name}
                    onChange={e => {
                      const updated = [...equipments];
                      updated[idx].name = e.target.value;
                      setEquipments(updated);
                    }}
                    placeholder="Ej: Banco de Condensadores Automático 50kVAr"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={eq.quantity}
                    onChange={e => {
                      const updated = [...equipments];
                      updated[idx].quantity = Number(e.target.value);
                      setEquipments(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ubicación en Obra</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={eq.location}
                      onChange={e => {
                        const updated = [...equipments];
                        updated[idx].location = e.target.value;
                        setEquipments(updated);
                      }}
                      placeholder="Ej: Sala de Bombas"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setEquipments(equipments.filter(e => e.id !== eq.id))}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Especificaciones Técnicas / Carga Nominal</label>
                  <input
                    type="text"
                    value={eq.technical_specs || ''}
                    onChange={e => {
                      const updated = [...equipments];
                      updated[idx].technical_specs = e.target.value;
                      setEquipments(updated);
                    }}
                    placeholder="Ej: 380V Trifásico, Arrancador Suave ABB, Corriente Nominal 45A, Cos φ 0.85"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 3: MATERIALES Y SUBGRUPOS */}
      {activeStep === 3 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-700" />
                <span>Paso 3: Organización de Materiales por Subgrupos y Tiempos</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Estructura jerárquica (1.1, 1.2...). Tiempo total de ingeniería estimado: <strong>{totalEstimatedHours} horas</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const count = subgroups.length + 1;
                setSubgroups([...subgroups, { id: `grp-${Date.now()}`, name: `Nuevo Subgrupo ${count}`, order: count, items: [] }]);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center space-x-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Subgrupo</span>
            </button>
          </div>

          <div className="space-y-6">
            {subgroups.map((grp, grpIdx) => {
              const groupItems = items.filter(it => it.subgroup_id === grp.id);
              const grpHours = groupItems.reduce((acc, it) => acc + (it.total_estimated_time_hours || 0), 0);

              return (
                <div key={grp.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center">
                        {grpIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={grp.name}
                        onChange={e => {
                          const updated = [...subgroups];
                          updated[grpIdx].name = e.target.value;
                          setSubgroups(updated);
                        }}
                        className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-700"
                      />
                      <span className="text-xs text-slate-500">({grpHours} horas estimadas)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubgroupIdForAdd(grp.id);
                        setShowItemPicker(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 border border-slate-300 rounded-lg flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Material</span>
                    </button>
                  </div>

                  <div className="p-3">
                    {groupItems.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center">No hay materiales en este subgrupo.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-1.5 px-2 w-12 text-center">#</th>
                              <th className="py-1.5 px-2">Descripción del Material</th>
                              <th className="py-1.5 px-2 w-24">Marca</th>
                              <th className="py-1.5 px-2 w-20 text-right">Cant.</th>
                              <th className="py-1.5 px-2 w-16 text-center">Unidad</th>
                              <th className="py-1.5 px-2 w-24 text-right">Tiempo Unit (h)</th>
                              <th className="py-1.5 px-2 w-20 text-right">Total (h)</th>
                              <th className="py-1.5 px-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {groupItems.map((item, itIdx) => (
                              <tr key={item.id} className="hover:bg-slate-50/80">
                                <td className="py-2 px-2 text-center font-mono font-bold text-slate-500">
                                  {grpIdx + 1}.{itIdx + 1}
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={e => handleUpdateItem(item.id, { description: e.target.value })}
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={item.brand || ''}
                                    onChange={e => handleUpdateItem(item.id, { brand: e.target.value })}
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                                    className="w-16 px-1.5 py-0.5 text-right border border-slate-300 rounded bg-white"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center text-slate-600 font-semibold">{item.unit}</td>
                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.unit_estimated_time_hours || 0}
                                    onChange={e => handleUpdateItem(item.id, { unit_estimated_time_hours: Number(e.target.value) })}
                                    className="w-16 px-1.5 py-0.5 text-right border border-slate-300 rounded bg-white"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-slate-700">
                                  {item.total_estimated_time_hours}h
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 4: PRECIOS Y PROVEEDORES */}
      {activeStep === 4 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Paso 4: Asignación de Costos, Proveedores y Márgenes Comerciales</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Método activo: <strong>Margen sobre Venta</strong> (Precio = Costo / (1 − Margen)). Descuento máximo sin autorización: {settings.max_unapproved_discount_pct || 20}%.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Filtrar:</span>
              <select
                value={filterPriceStatus}
                onChange={e => setFilterPriceStatus(e.target.value as any)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">Todos los ítems ({items.length})</option>
                <option value="unpriced">Sin precio asignado ({totals.unpricedItemsCount})</option>
                <option value="priced">Con precio asignado</option>
              </select>
            </div>
          </div>

          {totals.hasUnpricedItems && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-2 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Atención:</strong> Existen {totals.unpricedItemsCount} ítem(s) sin precio de costo asignado. No se podrá emitir una versión oficial definitiva hasta asignar precio o marcarlos como excluidos/suministrados por el cliente.
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2 w-10 text-center">#</th>
                  <th className="py-2 px-2">Descripción</th>
                  <th className="py-2 px-2 w-32">Proveedor Referencia</th>
                  {permissions.canViewCosts && <th className="py-2 px-2 w-28 text-right">Costo Unit. (Gs)</th>}
                  <th className="py-2 px-2 w-20 text-right">Margen %</th>
                  <th className="py-2 px-2 w-20 text-right">Desc. %</th>
                  <th className="py-2 px-2 w-28 text-right">Precio Venta (IVA Inc.)</th>
                  <th className="py-2 px-2 w-32 text-right">Total Ítem (Gs)</th>
                  <th className="py-2 px-2 w-16 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const isUnpriced = item.unit_cost_pyg === 0 && !item.is_excluded_or_client_provided;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 ${isUnpriced ? 'bg-amber-50/50' : ''}`}>
                      <td className="py-2 px-2 text-center font-mono text-slate-500">{item.hierarchical_number || idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-900">
                        {item.description}
                        {item.is_excluded_or_client_provided && (
                          <span className="ml-2 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px]">Suministrado Cliente</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-slate-600 truncate max-w-[130px]">
                        {item.provider_name || 'Sin asignar'}
                      </td>

                      {/* Costo solo para usuarios autorizados */}
                      {permissions.canViewCosts && (
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            value={item.unit_cost_pyg}
                            onChange={e => handleUpdateItem(item.id, { unit_cost_pyg: Number(e.target.value) })}
                            className="w-24 px-1.5 py-0.5 text-right border border-slate-300 rounded font-mono bg-white"
                          />
                        </td>
                      )}

                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          value={item.margin_pct}
                          onChange={e => handleUpdateItem(item.id, { margin_pct: Number(e.target.value) })}
                          className="w-16 px-1.5 py-0.5 text-right border border-slate-300 rounded bg-white"
                        />
                      </td>

                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => openDiscountModal(item)}
                          className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            (item.discount_pct || 0) > 20 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : (item.discount_pct || 0) > 0 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          {item.discount_pct ? `${item.discount_pct}%` : '0%'}
                        </button>
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">
                        {formatPYG(item.unit_sale_pyg)}
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-bold text-blue-900">
                        {formatPYG(item.total_sale_pyg)}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, { is_excluded_or_client_provided: !item.is_excluded_or_client_provided })}
                          title="Marcar como provisto por cliente"
                          className="text-[10px] text-slate-500 hover:text-blue-700 underline"
                        >
                          {item.is_excluded_or_client_provided ? 'Incluir' : 'Excluir'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 5: MANO DE OBRA */}
      {activeStep === 5 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-blue-700" />
                <span>Paso 5: Mano de Obra y Servicios Especializados</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Soporta horas-hombre (Tarifa × horas × operarios) o Servicios por unidad (Catálogo).</p>
            </div>

            <button
              type="button"
              onClick={() => setLaborLines([
                ...laborLines,
                {
                  id: `lab-${Date.now()}`,
                  method: 'man_hours',
                  technician_category: 'Ayudante Electricista',
                  hourly_rate_pyg: 35000,
                  hours_per_worker: 8,
                  worker_count: 1,
                  service_description: 'Asistencia en obra y pasaje de conductores',
                  total_pyg: 280000,
                  is_included_in_quote: true,
                  covered_by_other_concept: false,
                }
              ])}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Mano de Obra</span>
            </button>
          </div>

          <div className="space-y-3">
            {laborLines.map((line, idx) => (
              <div key={line.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción de la Tarea</label>
                    <input
                      type="text"
                      value={line.service_description}
                      onChange={e => {
                        const updated = [...laborLines];
                        updated[idx].service_description = e.target.value;
                        setLaborLines(updated);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Método de Cobro</label>
                    <select
                      value={line.method}
                      onChange={e => {
                        const updated = [...laborLines];
                        updated[idx].method = e.target.value as any;
                        updated[idx].total_pyg = PricingEngine.calculateLaborTotal(updated[idx]);
                        setLaborLines(updated);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="man_hours">Horas Hombre (Tarifa × h × op)</option>
                      <option value="service">Servicio Catálogo (Tarifa × cant)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <label className="text-xs font-bold text-slate-700">Total:</label>
                    <span className="font-mono font-bold text-sm text-blue-900">{formatPYG(line.total_pyg)}</span>
                    <button
                      type="button"
                      onClick={() => setLaborLines(laborLines.filter(l => l.id !== line.id))}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {line.method === 'man_hours' ? (
                  <div className="grid grid-cols-3 gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tarifa / Hora (Gs)</label>
                      <input
                        type="number"
                        value={line.hourly_rate_pyg}
                        onChange={e => {
                          const updated = [...laborLines];
                          updated[idx].hourly_rate_pyg = Number(e.target.value);
                          updated[idx].total_pyg = PricingEngine.calculateLaborTotal(updated[idx]);
                          setLaborLines(updated);
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Horas por Operario</label>
                      <input
                        type="number"
                        value={line.hours_per_worker}
                        onChange={e => {
                          const updated = [...laborLines];
                          updated[idx].hours_per_worker = Number(e.target.value);
                          updated[idx].total_pyg = PricingEngine.calculateLaborTotal(updated[idx]);
                          setLaborLines(updated);
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Cantidad de Trabajadores</label>
                      <input
                        type="number"
                        value={line.worker_count}
                        onChange={e => {
                          const updated = [...laborLines];
                          updated[idx].worker_count = Number(e.target.value);
                          updated[idx].total_pyg = PricingEngine.calculateLaborTotal(updated[idx]);
                          setLaborLines(updated);
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tarifa Servicio (Gs)</label>
                      <input
                        type="number"
                        value={line.service_rate_pyg}
                        onChange={e => {
                          const updated = [...laborLines];
                          updated[idx].service_rate_pyg = Number(e.target.value);
                          updated[idx].total_pyg = PricingEngine.calculateLaborTotal(updated[idx]);
                          setLaborLines(updated);
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Cantidad</label>
                      <input
                        type="number"
                        value={line.quantity || 1}
                        onChange={e => {
                          const updated = [...laborLines];
                          updated[idx].quantity = Number(e.target.value);
                          updated[idx].total_pyg = PricingEngine.calculateLaborTotal(updated[idx]);
                          setLaborLines(updated);
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id={`cov-${line.id}`}
                    checked={line.covered_by_other_concept}
                    onChange={e => {
                      const updated = [...laborLines];
                      updated[idx].covered_by_other_concept = e.target.checked;
                      updated[idx].total_pyg = PricingEngine.calculateLaborTotal(updated[idx]);
                      setLaborLines(updated);
                    }}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <label htmlFor={`cov-${line.id}`} className="text-xs text-slate-600">
                    Concepto ya cubierto por otro servicio (No duplicar costo en el total).
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 6: LOGÍSTICA */}
      {activeStep === 6 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-700" />
                <span>Paso 6: Gastos Logísticos y Traslados</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Movilidad por km, viáticos diarios por persona, alojamiento y fletes.</p>
            </div>

            <button
              type="button"
              onClick={() => setLogisticsLines([
                ...logisticsLines,
                {
                  id: `log-${Date.now()}`,
                  concept_type: 'daily_per_diem',
                  description: 'Viáticos de alimentación para cuadrilla en obra',
                  calculation_type: 'per_person_day',
                  quantity: 1,
                  unit: 'días',
                  people_count: 2,
                  days_or_nights: 3,
                  unit_rate_pyg: 100000,
                  cost_pyg: 600000,
                  margin_pct: 0,
                  sale_price_pyg: 600000,
                  is_included_in_quote: true,
                }
              ])}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Gasto</span>
            </button>
          </div>

          <div className="space-y-3">
            {logisticsLines.map((log, idx) => (
              <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Concepto Logístico</label>
                  <input
                    type="text"
                    value={log.description}
                    onChange={e => {
                      const updated = [...logisticsLines];
                      updated[idx].description = e.target.value;
                      setLogisticsLines(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Cálculo</label>
                  <select
                    value={log.concept_type}
                    onChange={e => {
                      const updated = [...logisticsLines];
                      updated[idx].concept_type = e.target.value as any;
                      const res = PricingEngine.calculateLogisticsTotal(updated[idx]);
                      updated[idx].cost_pyg = res.cost;
                      updated[idx].sale_price_pyg = res.sale;
                      setLogisticsLines(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="km_mobility">Movilidad (km × tarifa)</option>
                    <option value="daily_per_diem">Viáticos (personas × días × tarifa)</option>
                    <option value="daily_lodging">Alojamiento (personas × noches × tarifa)</option>
                    <option value="freight">Flete / Transporte Materiales</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400">Total Venta</span>
                    <span className="font-mono font-bold text-sm text-blue-900">{formatPYG(log.sale_price_pyg)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogisticsLines(logisticsLines.filter(l => l.id !== log.id))}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 7: CRONOGRAMA */}
      {activeStep === 7 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-700" />
                <span>Paso 7: Cronograma Preliminar y Fases de Trabajo</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Planificación de tareas, operarios requeridos y fechas estimadas.</p>
            </div>

            <button
              type="button"
              onClick={() => setScheduleTasks([
                ...scheduleTasks,
                {
                  id: `tsk-${Date.now()}`,
                  title: 'Nueva fase de trabajo',
                  assigned_to: 'Ramón Fleitas',
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  estimated_hours: 16,
                  workers_count: 2,
                  progress_pct: 0,
                  status: 'pending',
                }
              ])}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Fase</span>
            </button>
          </div>

          <div className="space-y-3">
            {scheduleTasks.map((tsk, idx) => (
              <div key={tsk.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre de la Fase / Tarea</label>
                  <input
                    type="text"
                    value={tsk.title}
                    onChange={e => {
                      const updated = [...scheduleTasks];
                      updated[idx].title = e.target.value;
                      setScheduleTasks(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsable</label>
                  <input
                    type="text"
                    value={tsk.assigned_to}
                    onChange={e => {
                      const updated = [...scheduleTasks];
                      updated[idx].assigned_to = e.target.value;
                      setScheduleTasks(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400">Horas Estimadas</span>
                    <span className="font-mono font-bold text-xs text-slate-800">{tsk.estimated_hours}h ({tsk.workers_count} op)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScheduleTasks(scheduleTasks.filter(t => t.id !== tsk.id))}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL PASO 8: RESUMEN Y EMISIÓN */}
      {activeStep === 8 && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Paso 8: Resumen Económico, Auditoría y Emisión</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Verifica los totales, liquida el IVA 10% y descarga cualquiera de los 4 documentos oficiales.</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySipap}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSipap ? '¡Copiado!' : 'SIPAP'}</span>
                </button>
              </div>
            </div>

            {/* TABLERO DE RESULTADOS ECONÓMICOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-semibold block">Materiales Venta</span>
                <span className="text-base font-black text-slate-900 font-mono">{formatPYG(totals.totalMaterialsSale)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-semibold block">Mano de Obra</span>
                <span className="text-base font-black text-slate-900 font-mono">{formatPYG(totals.totalLaborSale)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-semibold block">Logística</span>
                <span className="text-base font-black text-slate-900 font-mono">{formatPYG(totals.totalLogisticsSale)}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[11px] text-blue-700 font-semibold block">Subtotal Neto</span>
                <span className="text-base font-black text-blue-950 font-mono">{formatPYG(totals.subtotalNet)}</span>
              </div>
            </div>

            {/* TOTAL FINAL CON IVA */}
            <div className="p-4 bg-gradient-to-r from-[#0F2137] to-[#1E3A5F] text-white rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-amber-400 font-bold tracking-wide uppercase">Total General Presupuestado</span>
                <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
                  {formatPYG(totals.totalSale)}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Incluye IVA 10%: <strong className="text-white">{formatPYG(totals.ivaAmount)}</strong>. Equivalente aprox: <strong>USD {Math.round(totals.totalSale / exchangeRate)}</strong>.
                </p>
              </div>

              {permissions.canViewCosts && (
                <div className="sm:text-right bg-white/10 p-3 rounded-lg border border-white/20 backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Rentabilidad Interna Estimada</span>
                  <div className="text-lg font-black font-mono text-emerald-400">
                    +{formatPYG(totals.estimatedProfit)} ({totals.profitMarginPct}%)
                  </div>
                  <span className="text-[10px] text-slate-400">Costo total compra: {formatPYG(totals.totalCost)}</span>
                </div>
              )}
            </div>

            {/* SECCIÓN OFICIAL DE LOS 4 DOCUMENTOS PDF */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Documentos PDF Oficiales Disponibles para Descargar:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Presupuesto Comercial */}
                <button
                  type="button"
                  disabled={downloadingType !== null}
                  onClick={() => handleDownloadPDF('client')}
                  className="p-3.5 text-left border border-amber-300 bg-amber-50/60 hover:bg-amber-100/80 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs mb-1">
                    <Download className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
                    <span>Presupuesto Comercial</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 leading-snug">
                    Ejecutivo para el cliente. Marco dorado, datos SIPAP, sin costos de compra.
                  </p>
                </button>

                {/* 2. Lista de Materiales */}
                <button
                  type="button"
                  disabled={downloadingType !== null}
                  onClick={() => handleDownloadPDF('materials')}
                  className="p-3.5 text-left border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs mb-1">
                    <Layers className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
                    <span>Lista de Materiales</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Para compras, pañol y cuadrilla en obra. Solo cantidades y especificaciones.
                  </p>
                </button>

                {/* 3. Lista de Precios */}
                <button
                  type="button"
                  disabled={downloadingType !== null}
                  onClick={() => handleDownloadPDF('pricelist')}
                  className="p-3.5 text-left border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs mb-1">
                    <DollarSign className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
                    <span>Tarifario Comercial</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ítems valorizados con precio unitario y total (IVA inc) para licitaciones.
                  </p>
                </button>

                {/* 4. Resumen Interno Confidencial */}
                <button
                  type="button"
                  disabled={downloadingType !== null || !permissions.canViewCosts}
                  onClick={() => handleDownloadPDF('internal')}
                  className={`p-3.5 text-left border rounded-xl transition-all group ${
                    permissions.canViewCosts
                      ? 'border-red-200 bg-red-50/50 hover:bg-red-100/70 text-red-950'
                      : 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-xs mb-1">
                    <Lock className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                    <span>Costos y Márgenes</span>
                  </div>
                  <p className="text-[11px] leading-snug">
                    {permissions.canViewCosts
                      ? 'Confidencial. Proveedores, costos unitarios y margen de utilidad.'
                      : 'Acceso restringido a Administradores y Presupuestistas.'}
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTONES DE NAVEGACIÓN ANTERIOR / SIGUIENTE */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-40 flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="text-xs text-slate-500 font-semibold">
          Etapa {activeStep} de {WIZARD_STEPS.length}
        </span>

        <button
          type="button"
          disabled={activeStep === WIZARD_STEPS.length}
          onClick={() => setActiveStep(prev => Math.min(WIZARD_STEPS.length, prev + 1))}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm flex items-center space-x-1"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* MODAL DE BÚSQUEDA Y SELECCIÓN DE MATERIALES */}
      {showItemPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">Buscar en Catálogo de Materiales Eléctricos</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowItemPicker(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-200">
              <input
                type="text"
                autoFocus
                value={materialSearchQuery}
                onChange={e => setMaterialSearchQuery(e.target.value)}
                placeholder="Busca por cable, disyuntor, barra cobre, bulón, marca (ABB, Prysmian)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {(materialSearchQuery.trim() 
                ? StorageService.searchProducts(materialSearchQuery, 15).map(s => s.product)
                : products.slice(0, 15)
              ).map(prod => (
                <div
                  key={prod.id}
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  onClick={() => handleAddMaterialToSubgroup(prod)}
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{prod.name}</span>
                    <span className="text-[11px] text-slate-500">
                      Marca: {prod.brand || 'Genérica'} • Unidad: {prod.unit} • SKU: {prod.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-blue-900 block">
                      {formatPYG(prod.last_price_pyg)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{prod.last_provider_name || 'Último precio'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DESCUENTO Y AUTORIZACIÓN */}
      {discountModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Aplicar Descuento Comercial</span>
            </h3>

            <p className="text-xs text-slate-600 font-medium">
              Ítem: <strong>{discountModalItem.description}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Porcentaje de Descuento (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountInputPct}
                onChange={e => setDiscountInputPct(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Límite estándar de vendedor sin autorización: <strong>{settings.max_unapproved_discount_pct || 20}%</strong>.
              </p>
            </div>

            {discountInputPct > (settings.max_unapproved_discount_pct || 20) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <span className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Requiere Aprobación de Administrador</span>
                </span>
                <textarea
                  rows={2}
                  value={discountReason}
                  onChange={e => setDiscountReason(e.target.value)}
                  placeholder="Explica el motivo del descuento excepcional (volumen de compra, cliente estratégico)..."
                  className="w-full px-2 py-1 text-xs border border-amber-300 rounded bg-white"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDiscountModalItem(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Confirmar Descuento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NUEVO CLIENTE RÁPIDO */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-blue-700" />
              <span>Registrar Nuevo Cliente</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Nombre / Razón Social *</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Ej: Agroganadera Ka'aguy Porã S.A."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">RUC / C.I. *</label>
                <input
                  type="text"
                  value={newClientRuc}
                  onChange={e => setNewClientRuc(e.target.value)}
                  placeholder="Ej: 80056123-9"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Teléfono</label>
                <input
                  type="text"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  placeholder="Ej: +595 981 334455"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Ciudad</label>
                <input
                  type="text"
                  value={newClientCity}
                  onChange={e => setNewClientCity(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Dirección</label>
                <input
                  type="text"
                  value={newClientAddress}
                  onChange={e => setNewClientAddress(e.target.value)}
                  placeholder="Ej: Km 12 Acaray, Ciudad del Este"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newClientName.trim()) {
                    alert('Ingresa el nombre del cliente.');
                    return;
                  }
                  const newCli: Client = {
                    id: `cli-${Date.now()}`,
                    name: newClientName.trim(),
                    ruc_or_ci: newClientRuc.trim() || 'Sin RUC',
                    phone: newClientPhone.trim(),
                    email: '',
                    city: newClientCity.trim() || 'Asunción',
                    address: newClientAddress.trim(),
                    is_active: true,
                  };
                  StorageService.saveClient(newCli);
                  setClients(StorageService.getClients());
                  setSelectedClientId(newCli.id);
                  setShowNewClientModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

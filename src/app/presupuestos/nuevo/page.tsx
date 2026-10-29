'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  Tag
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { 
  Budget, 
  BudgetItem, 
  CanonicalProduct, 
  Client, 
  CompanySettings, 
  QuoteGroup, 
  LaborLine, 
  LogisticsLine, 
  UserProfile, 
  UserPermissions,
  CatalogService 
} from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale, daysSince } from '@/lib/utils';
import { PricingEngine } from '@/lib/pricing-engine';
import { 
  generateClientPDF, 
  generateMaterialsListPDF, 
  generateInternalCostSummaryPDF 
} from '@/lib/export/pdf-generator';
import { useAuth } from '@/lib/auth/AuthContext';

const WIZARD_STEPS = [
  { step: 1, title: 'Cliente y trabajo', subtitle: 'Datos generales y condiciones' },
  { step: 2, title: 'Productos y servicios', subtitle: 'Materiales, mano de obra y traslados' },
  { step: 3, title: 'Revisar y generar PDF', subtitle: 'Resumen económico y documentos' },
];

function NuevoPresupuestoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || searchParams?.get('id');

  const { user: authUser, isAdmin, isSecretaria } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(StorageService.getUserPermissions(null));
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());

  // Paso actual (1, 2 o 3)
  const [activeStep, setActiveStep] = useState(1);

  // Listados de apoyo
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);

  // 1. Cliente y trabajo
  const [budgetId, setBudgetId] = useState<string>('');
  const [budgetNumber, setBudgetNumber] = useState('');
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Opciones avanzadas (colapsables)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [currency, setCurrency] = useState<'PYG' | 'USD'>('PYG');
  const [exchangeRate, setExchangeRate] = useState(7950);
  const [globalMargin, setGlobalMargin] = useState(30);
  const [deliveryTerms, setDeliveryTerms] = useState('Inmediato / Según avance de obra');
  const [paymentTerms, setPaymentTerms] = useState('Anticipo 30%, 40% contra entrega de tableros, 30% contra recepción final');
  const [publicNotes, setPublicNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // 2. Productos y servicios (Empieza vacío)
  const [subgroups, setSubgroups] = useState<QuoteGroup[]>([
    { id: 'grp-1', name: 'Materiales principales', order: 1, items: [] },
  ]);
  const [activeSubgroupId, setActiveSubgroupId] = useState<string>('grp-1');
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [laborLines, setLaborLines] = useState<LaborLine[]>([]);
  const [logisticsLines, setLogisticsLines] = useState<LogisticsLine[]>([]);

  // Modales
  // Modal Agregar Cliente
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientRuc, setNewClientRuc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('Asunción');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Modal Agregar Producto
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<CanonicalProduct | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addMargin, setAddMargin] = useState<number>(30);

  // Modal Crear Producto Nuevo
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('un');
  const [newProdProvider, setNewProdProvider] = useState('');
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdMargin, setNewProdMargin] = useState<number>(30);

  // Modal Elegir Proveedor / Precio para ítem existente
  const [supplierModalItem, setSupplierModalItem] = useState<BudgetItem | null>(null);

  // Modal Agregar Mano de Obra
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborDesc, setLaborDesc] = useState('');
  const [laborType, setLaborType] = useState<'hours' | 'fixed'>('hours');
  const [laborHours, setLaborHours] = useState<number>(8);
  const [laborWorkers, setLaborWorkers] = useState<number>(1);
  const [laborHourlyRate, setLaborHourlyRate] = useState<number>(55000);
  const [laborFixedTotal, setLaborFixedTotal] = useState<number>(0);

  // Modal Agregar Traslado / Viático
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [logisticsConcept, setLogisticsConcept] = useState('Movilidad cuadrilla técnica');
  const [logisticsKm, setLogisticsKm] = useState<number>(50);
  const [logisticsRate, setLogisticsRate] = useState<number>(2500);

  // Descuento General
  const [generalDiscountPct, setGeneralDiscountPct] = useState<number>(0);
  const [discountApprovalNotice, setDiscountApprovalNotice] = useState<string | null>(null);

  // Estados de proceso
  const [isSaving, setIsSaving] = useState(false);
  const [savedBudget, setSavedBudget] = useState<Budget | null>(null);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [copiedSipap, setCopiedSipap] = useState(false);

  // Carga inicial y soporte para editar borrador existente
  useEffect(() => {
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setPermissions(StorageService.getUserPermissions(user));

    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);
    setGlobalMargin(loadedSettings.default_margin_pct || 30);
    setExchangeRate(loadedSettings.exchange_rate_usd_pyg || 7950);
    setValidityDays(loadedSettings.pdf_validez_dias || 15);
    setDeliveryTerms(loadedSettings.pdf_plazo_entrega_defecto || 'Inmediato / Según avance de obra');
    setPaymentTerms(loadedSettings.pdf_condicion_pago_defecto || 'Anticipo 30%, 40% contra entrega de tableros, 30% contra recepción final');

    const loadedClients = StorageService.getClients();
    setClients(loadedClients);

    const prods = StorageService.getProducts();
    setProducts(prods);

    const srvs = StorageService.getServices();
    setServices(srvs);

    if (editId) {
      // Cargar presupuesto existente para continuar o editar
      const existing = StorageService.getBudgetById(editId);
      if (existing) {
        setBudgetId(existing.id);
        setBudgetNumber(existing.budget_number);
        setTitle(existing.title);
        setSelectedClientId(existing.client.id);
        setCurrency(existing.currency || 'PYG');
        setExchangeRate(existing.exchange_rate_usd_pyg || 7950);
        setGlobalMargin(existing.global_margin_pct || 30);
        setValidityDays(existing.validity_days || 15);
        setDeliveryTerms(existing.delivery_terms || 'Inmediato / Según avance de obra');
        setPaymentTerms(existing.payment_terms || 'Anticipo 30%, 40% contra entrega de tableros, 30% contra recepción final');
        setPublicNotes(existing.notes || '');
        setInternalNotes(existing.internal_notes || '');
        setSubgroups(existing.subgroups && existing.subgroups.length > 0 ? existing.subgroups : [{ id: 'grp-1', name: 'Materiales principales', order: 1, items: [] }]);
        setItems(existing.items || []);
        setLaborLines(existing.labor_lines || []);
        setLogisticsLines(existing.logistics_lines || []);
        setSavedBudget(existing);
        return;
      }
    }

    // Nuevo presupuesto vacío
    const allBudgets = StorageService.getBudgets();
    const nextNum = PricingEngine.generateQuoteNumber(allBudgets);
    setBudgetId(`b-${Date.now()}`);
    setBudgetNumber(nextNum);
    if (loadedClients.length > 0) {
      setSelectedClientId(loadedClients[0].id);
    }
  }, [editId]);

  // Cliente seleccionado
  const currentClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0] || {
      id: 'cli-sin-asignar',
      name: 'Cliente sin asignar',
      ruc_or_ci: 'Sin RUC',
      phone: '',
      email: '',
      city: 'Asunción',
      address: '',
      is_active: true,
    };
  }, [clients, selectedClientId]);

  // Lista filtrada de clientes para el buscador
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.ruc_or_ci && c.ruc_or_ci.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  // Lista filtrada de productos para el buscador del modal
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 30);
    const q = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) || 
      (p.internal_code && p.internal_code.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [products, productSearch]);

  // Construcción de la instantánea de presupuesto para el cálculo del motor
  const currentQuoteSnapshot: Partial<Budget> = {
    budget_number: budgetNumber,
    title: title || 'Presupuesto de Instalación Eléctrica',
    client: currentClient,
    currency,
    global_margin_pct: globalMargin,
    pricing_method: 'margin',
    items,
    labor_lines: laborLines,
    logistics_lines: logisticsLines,
  };

  // Totales calculados mediante el motor centralizado
  const baseTotals = PricingEngine.calculateQuoteTotals(currentQuoteSnapshot, 10);

  // Aplicación del Descuento Global con salvaguardas
  const discountAmount = Math.round((baseTotals.subtotalNet * (generalDiscountPct || 0)) / 100);
  const subtotalNetWithDiscount = Math.max(0, baseTotals.subtotalNet - discountAmount);
  const ivaAmount = Math.round(subtotalNetWithDiscount * 0.10);
  const totalBudget = subtotalNetWithDiscount + ivaAmount;

  // Validación de descuento
  useEffect(() => {
    if (generalDiscountPct > 20 && isSecretaria) {
      setDiscountApprovalNotice('⚠️ Los descuentos mayores al 20% requieren autorización de Lucas Duré (Administrador). El presupuesto se guardará como "Pendiente de Autorización".');
    } else if (subtotalNetWithDiscount < baseTotals.totalCost) {
      setDiscountApprovalNotice('❌ Bloqueado: El descuento supera el margen y dejaría el presupuesto por debajo del costo de compra.');
    } else {
      setDiscountApprovalNotice(null);
    }
  }, [generalDiscountPct, isSecretaria, subtotalNetWithDiscount, baseTotals.totalCost]);

  // --- ACCIÓN: CREAR CLIENTE RÁPIDO ---
  const handleSaveQuickClient = () => {
    if (!newClientName.trim()) {
      alert('Ingresa el nombre o razón social del cliente.');
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
    setShowClientModal(false);
    setNewClientName('');
    setNewClientRuc('');
    setNewClientPhone('');
    setNewClientAddress('');
  };

  // --- ACCIÓN: AGREGAR PRODUCTO AL PRESUPUESTO ---
  const handleSelectProduct = (prod: CanonicalProduct) => {
    setSelectedProductToAdd(prod);
    setAddMargin(globalMargin);
    setAddQuantity(1);
  };

  const handleConfirmAddProduct = () => {
    if (!selectedProductToAdd) return;
    const cost = selectedProductToAdd.last_price_pyg || 0;
    const margin = addMargin || globalMargin;
    const unitSaleNet = PricingEngine.calculateSalePriceFromMargin(cost, margin);

    const targetSubgroupId = activeSubgroupId || subgroups[0]?.id || 'grp-1';
    const targetGroup = subgroups.find(g => g.id === targetSubgroupId) || subgroups[0];
    const subgroupIndex = subgroups.indexOf(targetGroup) + 1;
    const itemIndex = items.filter(i => i.subgroup_id === targetGroup.id).length + 1;

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${items.length + 1}`,
      subgroup_id: targetGroup.id,
      hierarchical_number: `${subgroupIndex}.${itemIndex}`,
      canonical_product_id: selectedProductToAdd.id,
      provider_id: selectedProductToAdd.history?.[0]?.provider_id,
      provider_name: selectedProductToAdd.last_provider_name || 'Proveedor General',
      item_type: 'material',
      description: selectedProductToAdd.name,
      brand: selectedProductToAdd.brand || 'Nacional',
      quantity: addQuantity || 1,
      unit: selectedProductToAdd.unit || 'un',
      unit_estimated_time_hours: 0.5,
      total_estimated_time_hours: Number((0.5 * (addQuantity || 1)).toFixed(1)),
      unit_cost_pyg: cost,
      margin_pct: margin,
      discount_pct: 0,
      unit_sale_pyg: unitSaleNet,
      total_sale_pyg: unitSaleNet * (addQuantity || 1),
      position: items.length + 1,
    };

    setItems([...items, newItem]);
    setSelectedProductToAdd(null);
    setShowProductPicker(false);
    setProductSearch('');
  };

  // --- ACCIÓN: CREAR PRODUCTO NUEVO EN CATÁLOGO ---
  const handleCreateProductInCatalog = () => {
    if (!newProdName.trim()) {
      alert('Ingresa el nombre del producto.');
      return;
    }
    const newId = `prod-${Date.now()}`;
    const code = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    const cost = Number(newProdCost) || 0;
    const margin = Number(newProdMargin) || 30;

    const newProd: CanonicalProduct = {
      id: newId,
      internal_code: code,
      category_id: 'cat-general',
      sku: code,
      name: newProdName.trim(),
      normalized_name: newProdName.trim().toLowerCase(),
      brand: newProdBrand.trim() || 'Nacional',
      unit: newProdUnit || 'un',
      is_active: true,
      base_description: `Material agregado en presupuesto: ${newProdName}`,
      min_price_pyg: cost,
      max_price_pyg: cost,
      last_price_pyg: cost,
      last_price_date: new Date().toISOString().split('T')[0],
      last_provider_name: newProdProvider.trim() || 'Proveedor Local',
      aliases: [newProdName.trim()],
      history: cost ? [{
        id: `h-${Date.now()}`,
        canonical_product_id: newId,
        provider_id: 'prov-manual',
        provider_name: newProdProvider.trim() || 'Proveedor Local',
        price_pyg: cost,
        currency: 'PYG',
        includes_iva: false,
        iva_rate_pct: 10,
        date: new Date().toISOString().split('T')[0],
        source_type: 'manual',
        notes: 'Cargado desde el asistente de presupuestos',
      }] : [],
    };

    StorageService.createProduct(newProd);
    const updatedProducts = StorageService.getProducts();
    setProducts(updatedProducts);

    // Agregarlo inmediatamente al presupuesto
    const targetGroup = subgroups.find(g => g.id === activeSubgroupId) || subgroups[0];
    const unitSaleNet = PricingEngine.calculateSalePriceFromMargin(cost, margin);
    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${items.length + 1}`,
      subgroup_id: targetGroup.id,
      hierarchical_number: `1.${items.length + 1}`,
      canonical_product_id: newProd.id,
      provider_name: newProd.last_provider_name,
      item_type: 'material',
      description: newProd.name,
      brand: newProd.brand,
      quantity: 1,
      unit: newProd.unit,
      unit_cost_pyg: cost,
      margin_pct: margin,
      discount_pct: 0,
      unit_sale_pyg: unitSaleNet,
      total_sale_pyg: unitSaleNet,
      position: items.length + 1,
    };
    setItems([...items, newItem]);

    setShowCreateProductModal(false);
    setShowProductPicker(false);
    setNewProdName('');
    setNewProdBrand('');
    setNewProdCost(0);
  };

  // --- ACCIÓN: ACTUALIZAR O ELIMINAR ÍTEM ---
  const handleUpdateItem = (itemId: string, patch: Partial<BudgetItem>) => {
    setItems(items.map(it => {
      if (it.id !== itemId) return it;
      const updated = { ...it, ...patch };

      if (patch.quantity !== undefined || patch.unit_sale_pyg !== undefined) {
        const qty = updated.quantity || 1;
        const unitSale = updated.unit_sale_pyg || 0;
        updated.total_sale_pyg = Math.round(unitSale * qty);
      }
      return updated;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(it => it.id !== itemId));
  };

  // --- ACCIÓN: ELEGIR PROVEEDOR / PRECIO PARA UN ÍTEM ---
  const handleSelectProviderPrice = (providerName: string, pricePyg: number) => {
    if (!supplierModalItem) return;
    const margin = supplierModalItem.margin_pct || globalMargin;
    const newUnitSale = PricingEngine.calculateSalePriceFromMargin(pricePyg, margin);

    handleUpdateItem(supplierModalItem.id, {
      provider_name: providerName,
      unit_cost_pyg: pricePyg,
      unit_sale_pyg: newUnitSale,
      total_sale_pyg: newUnitSale * (supplierModalItem.quantity || 1),
    });
    setSupplierModalItem(null);
  };

  // --- ACCIÓN: AGREGAR MANO DE OBRA ---
  const handleAddLabor = () => {
    if (!laborDesc.trim()) {
      alert('Ingresa una descripción del servicio de mano de obra.');
      return;
    }

    const totalHours = laborType === 'hours' ? (laborHours * laborWorkers) : 0;
    const cost = laborType === 'hours' ? (totalHours * laborHourlyRate) : laborFixedTotal;
    const margin = 25;
    const sale = PricingEngine.calculateSalePriceFromMargin(cost, margin);

    const newLine: LaborLine = {
      id: `lab-${Date.now()}`,
      method: laborType === 'hours' ? 'man_hours' : 'service',
      technician_category: 'Oficial Electricista Industrial',
      hourly_rate_pyg: laborHourlyRate,
      hours_per_worker: laborHours,
      worker_count: laborWorkers,
      service_description: laborDesc.trim(),
      total_pyg: sale,
      is_included_in_quote: true,
      covered_by_other_concept: false,
    };

    setLaborLines([...laborLines, newLine]);
    setShowLaborModal(false);
    setLaborDesc('');
  };

  // --- ACCIÓN: AGREGAR TRASLADO / VIÁTICO ---
  const handleAddLogistics = () => {
    const cost = logisticsKm * logisticsRate;
    const sale = cost; // Viáticos al costo o con mínimo recargo

    const newLine: LogisticsLine = {
      id: `log-${Date.now()}`,
      concept_type: 'km_mobility',
      description: logisticsConcept.trim(),
      calculation_type: 'per_km',
      quantity: logisticsKm,
      unit: 'km',
      unit_rate_pyg: logisticsRate,
      cost_pyg: cost,
      margin_pct: 0,
      sale_price_pyg: sale,
      is_included_in_quote: true,
    };

    setLogisticsLines([...logisticsLines, newLine]);
    setShowLogisticsModal(false);
  };

  // --- GUARDAR PRESUPUESTO (Borrador o Emitido) ---
  const handleSaveBudget = (status: 'draft' | 'sent' = 'draft') => {
    if (!title.trim()) {
      alert('Por favor escribe un título o descripción del trabajo.');
      setActiveStep(1);
      return;
    }

    if (subtotalNetWithDiscount < baseTotals.totalCost) {
      alert('No se puede guardar: El precio de venta resultante es inferior al costo total de compra.');
      return;
    }

    let finalStatus: any = status;
    if (generalDiscountPct > 20 && isSecretaria) {
      finalStatus = 'pending_authorization';
    }

    setIsSaving(true);
    const newBudget: Budget = {
      id: budgetId || `b-${Date.now()}`,
      budget_number: budgetNumber,
      title: title.trim(),
      project_name: title.trim(),
      client: currentClient,
      status: finalStatus,
      is_archived: false,
      version: 1,
      current_revision: status === 'sent' ? 1 : 0,
      revisions: [],
      currency,
      exchange_rate_usd_pyg: exchangeRate,
      default_iva_rate_pct: 10,
      global_margin_pct: globalMargin,
      pricing_method: 'margin',
      total_materials_cost_pyg: baseTotals.totalMaterialsCost,
      total_materials_sale_pyg: baseTotals.totalMaterialsSale,
      total_labor_sale_pyg: baseTotals.totalLaborSale,
      total_logistics_sale_pyg: baseTotals.totalLogisticsSale,
      total_other_sale_pyg: 0,
      total_discount_amount_pyg: discountAmount,
      subtotal_net_pyg: subtotalNetWithDiscount,
      iva_amount_pyg: ivaAmount,
      total_cost_pyg: baseTotals.totalCost,
      total_sale_pyg: totalBudget,
      estimated_profit_pyg: Math.max(0, subtotalNetWithDiscount - baseTotals.totalCost),
      profit_margin_pct: subtotalNetWithDiscount > 0 ? Math.round(((subtotalNetWithDiscount - baseTotals.totalCost) / subtotalNetWithDiscount) * 100) : 0,
      validity_days: validityDays,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      salesperson_name: authUser?.full_name || 'Lucas Duré',
      notes: publicNotes,
      internal_notes: internalNotes,
      suggested_price_strategy: 'last_price',
      equipments: [],
      subgroups,
      items,
      labor_lines: laborLines,
      logistics_lines: logisticsLines,
      schedule_tasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    StorageService.saveBudget(newBudget);
    setSavedBudget(newBudget);
    setIsSaving(false);

    if (finalStatus === 'pending_authorization') {
      alert(`Presupuesto ${newBudget.budget_number} guardado. Al tener un descuento del ${generalDiscountPct}%, quedó como "Pendiente de Autorización" de Lucas Duré.`);
    } else if (status === 'sent') {
      alert(`¡Presupuesto ${newBudget.budget_number} emitido oficialmente con éxito!`);
    } else {
      alert(`Presupuesto ${newBudget.budget_number} guardado como Borrador. Puedes continuar editándolo en cualquier momento.`);
    }
  };

  // --- DESCARGA DE DOCUMENTOS PDF ---
  const handleDownloadPDF = async (type: 'client' | 'materials' | 'internal') => {
    try {
      setDownloadingType(type);
      const budgetForExport: Budget = savedBudget || {
        ...currentQuoteSnapshot,
        id: budgetId || `temp-${Date.now()}`,
        budget_number: budgetNumber,
        title: title || 'Presupuesto de Instalación Eléctrica',
        project_name: title || 'Presupuesto de Instalación Eléctrica',
        client: currentClient,
        status: 'draft',
        is_archived: false,
        version: 1,
        current_revision: 1,
        revisions: [],
        total_materials_cost_pyg: baseTotals.totalMaterialsCost,
        total_materials_sale_pyg: baseTotals.totalMaterialsSale,
        total_labor_sale_pyg: baseTotals.totalLaborSale,
        total_logistics_sale_pyg: baseTotals.totalLogisticsSale,
        total_other_sale_pyg: 0,
        total_discount_amount_pyg: discountAmount,
        subtotal_net_pyg: subtotalNetWithDiscount,
        iva_amount_pyg: ivaAmount,
        total_cost_pyg: baseTotals.totalCost,
        total_sale_pyg: totalBudget,
        estimated_profit_pyg: Math.max(0, subtotalNetWithDiscount - baseTotals.totalCost),
        profit_margin_pct: 30,
        validity_days: validityDays,
        delivery_terms: deliveryTerms,
        payment_terms: paymentTerms,
        salesperson_name: authUser?.full_name || 'Lucas Duré',
        notes: publicNotes,
        internal_notes: internalNotes,
        suggested_price_strategy: 'last_price',
        equipments: [],
        subgroups,
        items,
        labor_lines: laborLines,
        logistics_lines: logisticsLines,
        schedule_tasks: [],
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
        filename = `Lista_Materiales_${budgetNumber}.pdf`;
      } else if (type === 'internal') {
        if (!isAdmin && !permissions.canViewCosts) {
          alert('Acceso restringido: Solo el Administrador puede generar el informe de costos internos.');
          return;
        }
        doc = await generateInternalCostSummaryPDF(budgetForExport, settings);
        filename = `Costos_Internos_${budgetNumber}_CONFIDENCIAL.pdf`;
      }

      if (doc) doc.save(filename);
    } catch (err) {
      console.error('Error al generar PDF', err);
      alert('Ocurrió un error al generar el PDF.');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*PRESUPUESTO ELÉCTRICO* ⚡\n*Construlogica Emprendimientos S.A.*\n\n*Cliente:* ${currentClient.name}\n*Comprobante:* ${budgetNumber}\n*Total:* ${formatPYG(totalBudget)} (IVA 10% incluido)\n*Validez:* ${validityDays} días\n\n_Generado profesionalmente por ElectroCotiza._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopySipap = () => {
    const text = `*DATOS PARA TRANSFERENCIA BANCARIA SIPAP*\nEmpresa: ${settings.company_name}\nRUC: ${settings.ruc}\nBanco: ${settings.bank_name}\nCta Cte: ${settings.bank_account_number}\nAlias SIPAP: ${settings.bank_sipap_alias}`;
    navigator.clipboard.writeText(text);
    setCopiedSipap(true);
    setTimeout(() => setCopiedSipap(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      
      {/* BARRA SUPERIOR CON ESTADO Y ACCIONES PRINCIPALES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link 
            href="/presupuestos" 
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Volver a la lista de presupuestos"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-xs sm:text-sm bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded border border-blue-200">
                {budgetNumber}
              </span>
              <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
                Borrador
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {title || 'Nuevo Presupuesto'}
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
            <span>Guardar borrador</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleSaveBudget('sent')}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar presupuesto</span>
          </button>
        </div>
      </div>

      {/* ASISTENTE SIMPLIFICADO DE 3 PASOS CLAROS */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {WIZARD_STEPS.map((s) => {
            const isActive = activeStep === s.step;
            const isCompleted = activeStep > s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-all ${
                  isActive 
                    ? 'bg-blue-900 text-white shadow-sm' 
                    : isCompleted 
                    ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-900 hover:bg-emerald-50' 
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  isActive 
                    ? 'bg-amber-400 text-slate-950' 
                    : isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isCompleted ? '✓' : s.step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    {s.title}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                    {s.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PASO 1: CLIENTE Y TRABAJO */}
      {/* ------------------------------------------------------------- */}
      {activeStep === 1 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-blue-800" />
                <span>Paso 1: Cliente y Trabajo</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona el cliente a quien va dirigido el presupuesto y describe el trabajo a cotizar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SELECTOR DE CLIENTE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="text-xs text-blue-700 font-bold hover:underline flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Agregar cliente</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Filtrar por nombre o RUC..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {filteredClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.ruc_or_ci ? `(${c.ruc_or_ci})` : ''} - {c.city || 'Asunción'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ficha rápida del cliente seleccionado */}
              {currentClient && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{currentClient.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">RUC: {currentClient.ruc_or_ci || 'Sin RUC'}</span>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="block">{currentClient.phone || 'Sin teléfono'}</span>
                    <span className="text-slate-500">{currentClient.city || 'Asunción'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CONCEPTO O TÍTULO DEL TRABAJO */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Título o concepto del trabajo *</label>
              <textarea
                rows={3}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Montaje e instalación de tablero general, peinado de canalizaciones y conexión de acometida trifásica para planta industrial."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400 block">
                Este nombre aparecerá en la cabecera del presupuesto que verá el cliente.
              </span>
            </div>

            {/* FECHA Y VALIDEZ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Fecha de emisión</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Validez de la oferta</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={validityDays}
                    onChange={e => setValidityDays(Number(e.target.value) || 15)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
                  />
                  <span className="text-xs text-slate-500 shrink-0">días</span>
                </div>
              </div>
            </div>

            {/* BOTÓN COLAPSABLE OPCIONES AVANZADAS */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>Condiciones de pago, moneda y notas</span>
                {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PANEL COLAPSABLE DE OPCIONES AVANZADAS */}
          {showAdvancedOptions && (
            <div className="pt-3 border-t border-slate-200 space-y-4 bg-slate-50/50 p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Moneda</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as 'PYG' | 'USD')}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PYG">Guaraníes (Gs.)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Tipo de cambio Gs./USD</label>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={e => setExchangeRate(Number(e.target.value) || 7950)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Plazo de entrega</label>
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={e => setDeliveryTerms(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Condición de pago</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Notas visibles para el cliente</label>
                  <textarea
                    rows={2}
                    value={publicNotes}
                    onChange={e => setPublicNotes(e.target.value)}
                    placeholder="Incluye detalles de garantía, plazos o aclaraciones para el cliente..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Notas internas confidenciales</label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Apuntes solo para el equipo (no saldrán en el PDF del cliente)..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BOTÓN CONTINUAR AL PASO 2 */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
            >
              <span>Continuar a Productos y Servicios</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PASO 2: PRODUCTOS Y SERVICIOS */}
      {/* ------------------------------------------------------------- */}
      {activeStep === 2 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-800" />
                <span>Paso 2: Productos y Servicios</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Agrega los materiales requeridos, mano de obra o servicios de instalación y viáticos.
              </p>
            </div>

            {/* BOTONES RÁPIDOS DE AGREGAR */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowProductPicker(true)}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Agregar producto</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLaborModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 text-blue-700" />
                <span>+ Mano de obra</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLogisticsModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-slate-600" />
                <span>+ Traslado / Viático</span>
              </button>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE PRODUCTOS Y MATERIALES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Lista de Materiales y Equipos ({items.length})
              </h3>
              {items.length > 0 && (
                <span className="text-xs text-slate-500 font-semibold">
                  Subtotal materiales: <strong className="text-slate-900 font-mono">{formatPYG(baseTotals.totalMaterialsSale)}</strong>
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Aún no has agregado productos</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    El presupuesto empieza con la lista vacía. Haz clic en el botón de abajo para buscar en el catálogo o registrar un producto nuevo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductPicker(true)}
                  className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800 inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Agregar primer producto</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Producto / Concepto</th>
                      <th className="py-2.5 px-3">Proveedor & Cotización</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit. (Neto)</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal Neto</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{it.description}</span>
                          <span className="text-[10px] text-slate-500">Marca: {it.brand || 'Nacional'} • {it.unit}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {it.provider_name || 'Proveedor general'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSupplierModalItem(it)}
                              className="text-[10px] text-blue-700 hover:underline font-bold"
                              title="Elegir otro proveedor o precio para este ítem"
                            >
                              Elegir
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {formatPYG(it.unit_sale_pyg)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={e => handleUpdateItem(it.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-16 px-1.5 py-1 text-center font-bold font-mono text-xs border border-slate-300 rounded bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950">
                          {formatPYG(it.total_sale_pyg)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Eliminar ítem"
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

          {/* SECCIÓN MANO DE OBRA Y SERVICIOS */}
          {laborLines.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-blue-700" />
                  <span>Mano de obra y servicios de montaje ({laborLines.length})</span>
                </h3>
                <span className="text-xs font-semibold text-slate-600">
                  Total mano de obra: <strong className="font-mono text-slate-900">{formatPYG(baseTotals.totalLaborSale)}</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Descripción del servicio</th>
                      <th className="py-2 px-3">Técnicos & Horas</th>
                      <th className="py-2 px-3 text-right">Importe Neto</th>
                      <th className="py-2 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laborLines.map(line => (
                      <tr key={line.id}>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {line.service_description}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {line.worker_count} operario(s) • {line.hours_per_worker}h
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatPYG(line.total_pyg)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setLaborLines(laborLines.filter(l => l.id !== line.id))}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECCIÓN TRASLADOS Y LOGÍSTICA */}
          {logisticsLines.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-slate-700" />
                  <span>Traslados, Fletes y Viáticos ({logisticsLines.length})</span>
                </h3>
                <span className="text-xs font-semibold text-slate-600">
                  Total traslados: <strong className="font-mono text-slate-900">{formatPYG(baseTotals.totalLogisticsSale)}</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Concepto</th>
                      <th className="py-2 px-3">Distancia / Cantidad</th>
                      <th className="py-2 px-3 text-right">Importe Neto</th>
                      <th className="py-2 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logisticsLines.map(log => (
                      <tr key={log.id}>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {log.description}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {log.quantity} {log.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatPYG(log.sale_price_pyg)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setLogisticsLines(logisticsLines.filter(l => l.id !== log.id))}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center space-x-2 shadow-sm"
            >
              <span>Revisar y Generar PDF</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PASO 3: REVISAR Y GENERAR PDF */}
      {/* ------------------------------------------------------------- */}
      {activeStep === 3 && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Paso 3: Revisión Económica y Generación de Presupuesto</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifica los subtotales, aplica descuentos si corresponde y descarga los documentos oficiales listos para enviar.
              </p>
            </div>

            {/* RESUMEN ECONÓMICO DETALLADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* DESGLOSE POR CONCEPTOS */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Desglose de conceptos (Neto)
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Materiales y equipos ({items.length} ítems):</span>
                    <span className="font-mono font-bold text-slate-800">{formatPYG(baseTotals.totalMaterialsSale)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Mano de obra y montaje:</span>
                    <span className="font-mono font-bold text-slate-800">{formatPYG(baseTotals.totalLaborSale)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Traslados y logística en obra:</span>
                    <span className="font-mono font-bold text-slate-800">{formatPYG(baseTotals.totalLogisticsSale)}</span>
                  </div>

                  {/* CAMPO DE DESCUENTO CON SALVAGUARDA */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                        <span>Descuento comercial (%):</span>
                        {isSecretaria && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-normal">
                            Hasta 20%
                          </span>
                        )}
                      </label>
                      <span className="font-mono font-bold text-rose-600">
                        -{formatPYG(discountAmount)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={generalDiscountPct}
                        onChange={e => setGeneralDiscountPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-center"
                      />
                      <span className="text-xs text-slate-500">% sobre el subtotal neto</span>
                    </div>

                    {discountApprovalNotice && (
                      <p className={`text-[11px] font-semibold mt-1.5 ${discountApprovalNotice.includes('Bloqueado') ? 'text-rose-600' : 'text-amber-800'}`}>
                        {discountApprovalNotice}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* TOTALES FINALES (SUBLTOTAL NETO + IVA 10% = TOTAL PRESUPUESTO) */}
              <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-md">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                    Total del Presupuesto
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
                    {formatPYG(totalBudget)}
                  </div>
                  <span className="text-xs text-slate-300 mt-0.5 block">
                    {currency === 'USD' ? `Aproximadamente USD ${(totalBudget / exchangeRate).toFixed(2)}` : 'Guaraníes paraguayos (Gs.)'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-300 font-mono">
                  <div className="flex items-center justify-between">
                    <span>Subtotal Neto:</span>
                    <span>{formatPYG(subtotalNetWithDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IVA Liquidado (10%):</span>
                    <span>{formatPYG(ivaAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white font-bold pt-1 border-t border-slate-800 text-sm">
                    <span>Total con IVA 10%:</span>
                    <span className="text-amber-300">{formatPYG(totalBudget)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES DE DESCARGA DE DOCUMENTOS PDF */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Documentos para Descargar e Imprimir
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. PDF EJECUTIVO CLIENTE */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF('client')}
                  disabled={downloadingType === 'client'}
                  className="p-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-sm text-left transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <Download className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black">
                      Oficial
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm block">Presupuesto para Cliente</span>
                    <span className="text-[10px] text-blue-200 block">
                      Diseño con membrete y marco dorado
                    </span>
                  </div>
                </button>

                {/* 2. PDF LISTA DE MATERIALES PARA COMPRA/PAÑOL */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF('materials')}
                  disabled={downloadingType === 'materials'}
                  className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 text-left transition-all flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Layers className="w-5 h-5 text-slate-600" />
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                      Pañol
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm block">Lista de Materiales</span>
                    <span className="text-[10px] text-slate-500 block">
                      Cantidades y marcas (sin precios)
                    </span>
                  </div>
                </button>

                {/* 3. PDF COSTOS INTERNOS (SOLO VISIBLE SI ES ADMIN) */}
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF('internal')}
                    disabled={downloadingType === 'internal'}
                    className="p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-950 rounded-xl border border-rose-200 text-left transition-all flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Lock className="w-5 h-5 text-rose-600" />
                      <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold">
                        Confidencial
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm block">Costos y Rentabilidad</span>
                      <span className="text-[10px] text-rose-600 block">
                        Visible únicamente para Lucas Duré
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left flex flex-col justify-center space-y-1 opacity-70">
                    <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Costos Internos</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Módulo restringido al administrador.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES DE COMPARTIR Y CONTACTO RÁPIDO */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Enviar resumen por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopySipap}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>{copiedSipap ? '¡Datos copiados!' : 'Copiar datos SIPAP'}</span>
              </button>
            </div>

            {/* NAVEGACIÓN INFERIOR */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a Productos</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveBudget('sent')}
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar y Emitir Presupuesto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: AGREGAR PRODUCTO DESDE EL CATÁLOGO */}
      {/* ------------------------------------------------------------- */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Cabecera del modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Buscar producto para agregar</h3>
                <p className="text-xs text-slate-500">Selecciona un material del catálogo o crea uno nuevo</p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductPicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador */}
            <div className="p-4 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  autoFocus
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar por nombre, marca (ej: cable 2.5, disyuntor, caño corrugado)..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs text-slate-500">No encontramos productos con ese nombre.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductPicker(false);
                      setShowCreateProductModal(true);
                      setNewProdName(productSearch);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear "{productSearch}" como producto nuevo</span>
                  </button>
                </div>
              ) : (
                filteredProducts.map(p => {
                  const isStale = isPriceStale(p.last_price_date, 60);
                  const isSelected = selectedProductToAdd?.id === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <span className="font-bold text-xs text-slate-900 block truncate">{p.name}</span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                          <span>Marca: <strong>{p.brand}</strong></span>
                          <span>•</span>
                          <span>Unidad: <strong>{p.unit}</strong></span>
                          <span>•</span>
                          <span>Proveedor: {p.last_provider_name || 'Proveedor general'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-slate-900 block">
                          {formatPYG(p.last_price_pyg)}
                        </span>
                        <span className={`text-[10px] font-semibold ${isStale ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {isStale ? 'Precio antiguo' : 'Actualizado'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie de modal con selector de cantidad y margen si hay uno seleccionado */}
            {selectedProductToAdd ? (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">Cantidad ({selectedProductToAdd.unit})</label>
                    <input
                      type="number"
                      min={1}
                      value={addQuantity}
                      onChange={e => setAddQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">Margen venta</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={addMargin}
                        onChange={e => setAddMargin(Number(e.target.value) || 30)}
                        className="w-16 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-center"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <span className="text-[11px] text-slate-500 block">Precio venta unit. (Neto)</span>
                    <span className="font-mono font-bold text-xs text-blue-900">
                      {formatPYG(PricingEngine.calculateSalePriceFromMargin(selectedProductToAdd.last_price_pyg || 0, addMargin))}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAddProduct}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Agregar al presupuesto
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">¿No encuentras el producto en la lista?</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductPicker(false);
                    setShowCreateProductModal(true);
                  }}
                  className="font-bold text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Crear producto nuevo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: CREAR PRODUCTO NUEVO EN CATÁLOGO */}
      {/* ------------------------------------------------------------- */}
      {showCreateProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Registrar producto nuevo</h3>
                <p className="text-xs text-slate-500">Se agregará al catálogo comercial y a este presupuesto</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nombre del producto *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder="Ej: Cable unipolar 4mm² antillama"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Marca</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={e => setNewProdBrand(e.target.value)}
                    placeholder="Ej: Prysmian, ABB, Tigre..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Unidad de medida</label>
                  <select
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="un">Unidad (un)</option>
                    <option value="m">Metros (m)</option>
                    <option value="rollo">Rollo</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="juego">Juego</option>
                    <option value="gl">Global</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Precio de compra (Costo Gs.)</label>
                  <input
                    type="number"
                    value={newProdCost}
                    onChange={e => setNewProdCost(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Margen de venta (%)</label>
                  <input
                    type="number"
                    value={newProdMargin}
                    onChange={e => setNewProdMargin(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Proveedor de referencia</label>
                <input
                  type="text"
                  value={newProdProvider}
                  onChange={e => setNewProdProvider(e.target.value)}
                  placeholder="Ej: Record Electric, Enerluz, Lumicor..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateProductInCatalog}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Guardar y agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: ELEGIR PROVEEDOR / PRECIO PARA ÍTEM */}
      {/* ------------------------------------------------------------- */}
      {supplierModalItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Elegir precio y proveedor</h3>
                <p className="text-xs text-slate-500">{supplierModalItem.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSupplierModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Cotizaciones registradas para este producto:</span>
              
              {(() => {
                const prod = products.find(p => p.id === supplierModalItem.canonical_product_id);
                const history = prod?.history || [];

                if (history.length === 0) {
                  return (
                    <div className="bg-slate-50 p-4 rounded-xl text-center text-xs text-slate-500">
                      No hay historial múltiple de proveedores para este material.
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {history.map(h => (
                      <div
                        key={h.id}
                        onClick={() => handleSelectProviderPrice(h.provider_name, h.price_pyg)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{h.provider_name}</span>
                          <span className="text-[10px] text-slate-500">{formatDatePY(h.date)}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          {formatPYG(h.price_pyg)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSupplierModalItem(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: AGREGAR MANO DE OBRA */}
      {/* ------------------------------------------------------------- */}
      {showLaborModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Agregar mano de obra</h3>
                <p className="text-xs text-slate-500">Servicio de montaje, peinado de tableros o técnicos</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLaborModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Descripción del trabajo *</label>
                <input
                  type="text"
                  value={laborDesc}
                  onChange={e => setLaborDesc(e.target.value)}
                  placeholder="Ej: Montaje y conexionado de tablero seccional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Modalidad de cálculo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLaborType('hours')}
                    className={`py-1.5 px-3 rounded-lg border font-bold text-center ${
                      laborType === 'hours' 
                        ? 'bg-blue-900 text-white border-blue-900' 
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Por horas hombre
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaborType('fixed')}
                    className={`py-1.5 px-3 rounded-lg border font-bold text-center ${
                      laborType === 'fixed' 
                        ? 'bg-blue-900 text-white border-blue-900' 
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Monto cerrado
                  </button>
                </div>
              </div>

              {laborType === 'hours' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Técnicos</label>
                    <input
                      type="number"
                      min={1}
                      value={laborWorkers}
                      onChange={e => setLaborWorkers(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Horas c/u</label>
                    <input
                      type="number"
                      min={1}
                      value={laborHours}
                      onChange={e => setLaborHours(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Tarifa/h Gs.</label>
                    <input
                      type="number"
                      value={laborHourlyRate}
                      onChange={e => setLaborHourlyRate(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Monto total mano de obra (Gs.)</label>
                  <input
                    type="number"
                    value={laborFixedTotal}
                    onChange={e => setLaborFixedTotal(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowLaborModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddLabor}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Agregar mano de obra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: AGREGAR TRASLADO / VIÁTICO */}
      {/* ------------------------------------------------------------- */}
      {showLogisticsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Agregar traslado o viático</h3>
                <p className="text-xs text-slate-500">Combustible, movilidad de cuadrilla o flete de tableros</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogisticsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Concepto *</label>
                <input
                  type="text"
                  value={logisticsConcept}
                  onChange={e => setLogisticsConcept(e.target.value)}
                  placeholder="Ej: Movilidad cuadrilla técnica (Asunción - Obra)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Kilómetros o unidades</label>
                  <input
                    type="number"
                    min={1}
                    value={logisticsKm}
                    onChange={e => setLogisticsKm(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Tarifa por km (Gs.)</label>
                  <input
                    type="number"
                    value={logisticsRate}
                    onChange={e => setLogisticsRate(Number(e.target.value) || 2500)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-xs flex justify-between">
                <span className="text-slate-600">Total traslado:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatPYG(logisticsKm * logisticsRate)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowLogisticsModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddLogistics}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Agregar traslado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 6: AGREGAR CLIENTE RÁPIDO */}
      {/* ------------------------------------------------------------- */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Registrar nuevo cliente</h3>
                <p className="text-xs text-slate-500">Se guardará y seleccionará automáticamente</p>
              </div>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Nombre o Razón Social *</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Ej: Agroganadera Santa Rosa S.A."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">RUC o C.I.</label>
                  <input
                    type="text"
                    value={newClientRuc}
                    onChange={e => setNewClientRuc(e.target.value)}
                    placeholder="80012345-6"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Teléfono</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    placeholder="0981 123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Ciudad</label>
                  <input
                    type="text"
                    value={newClientCity}
                    onChange={e => setNewClientCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Dirección / Obra</label>
                  <input
                    type="text"
                    value={newClientAddress}
                    onChange={e => setNewClientAddress(e.target.value)}
                    placeholder="Km 10 / Parque Industrial"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickClient}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Guardar cliente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function NuevoPresupuestoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-500 font-semibold">
        Cargando asistente de presupuestos...
      </div>
    }>
      <NuevoPresupuestoContent />
    </Suspense>
  );
}

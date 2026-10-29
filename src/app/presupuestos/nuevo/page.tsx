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
  Tag,
  Edit2,
  Loader2
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
import { formatPYG, formatDatePY, isPriceStale } from '@/lib/utils';
import { PricingEngine } from '@/lib/pricing-engine';
import { 
  generateClientPDF, 
  generateMaterialsListPDF, 
  generateInternalCostSummaryPDF 
} from '@/lib/export/pdf-generator';
import { useAuth } from '@/lib/auth/AuthContext';

const WIZARD_STEPS = [
  { step: 1, title: 'Cliente y trabajo', subtitle: 'Datos generales y condiciones' },
  { step: 2, title: 'Productos y servicios', subtitle: 'Materiales, grupos, mano de obra' },
  { step: 3, title: 'Revisar y generar PDF', subtitle: 'Resumen económico y documentos' },
];

// Plantillas eléctricas de referencia rápida
const PRESET_TEMPLATES = [
  {
    id: 'tpl-tablero-general',
    name: 'Tablero General Trifásico 63A',
    description: 'Gabinete estanco, llave termomagnética tetrapolar, diferencial y barras',
    items: [
      { name: 'Gabinete metálico estanco IP55 600x400x200mm', brand: 'Fixopar', unit: 'un', defaultQty: 1, cost: 480000, provider: 'FIXOPAR S.A.' },
      { name: 'Llave termomagnética tetrapolar 63A curva C', brand: 'ABB', unit: 'un', defaultQty: 1, cost: 260000, provider: 'ELECTRO SYSTEM S.R.L.' },
      { name: 'Disyuntor diferencial tetrapolar 40A 30mA', brand: 'ABB', unit: 'un', defaultQty: 1, cost: 320000, provider: 'ELECTRO SYSTEM S.R.L.' },
      { name: 'Repartidor tetrapolar modular 125A', brand: 'Enerluz', unit: 'un', defaultQty: 1, cost: 185000, provider: 'ENERLUZ S.A.' },
      { name: 'Termomagnética bipolar 20A curva C', brand: 'Enerluz', unit: 'un', defaultQty: 4, cost: 42000, provider: 'ENERLUZ S.A.' },
    ],
  },
  {
    id: 'tpl-puesta-tierra',
    name: 'Puesta a Tierra ANDE (Norma NP 2 028 96)',
    description: 'Jabalina de cobre, conector bronce, cable desnudo y cámara de inspección',
    items: [
      { name: 'Jabalina de cobre 5/8" x 2.40m alta conductividad', brand: 'Fixopar', unit: 'un', defaultQty: 1, cost: 165000, provider: 'FIXOPAR S.A.' },
      { name: 'Conector para jabalina tipo grapa bronce 5/8"', brand: 'Enerluz', unit: 'un', defaultQty: 1, cost: 28000, provider: 'ENERLUZ S.A.' },
      { name: 'Cable de cobre desnudo electrolítico 35 mm²', brand: 'Electropar', unit: 'm', defaultQty: 12, cost: 24500, provider: 'ELECTROPAR S.A.' },
      { name: 'Cámara de inspección PVC c/ tapa 200x200mm', brand: 'Fixopar', unit: 'un', defaultQty: 1, cost: 45000, provider: 'FIXOPAR S.A.' },
      { name: 'Compuesto químico de suelo (Gel bentonita)', brand: 'Enerluz', unit: 'bolsa', defaultQty: 1, cost: 85000, provider: 'ENERLUZ S.A.' },
    ],
  },
  {
    id: 'tpl-canalizaciones',
    name: 'Canalizaciones en Bandeja Portacable',
    description: 'Bandeja perforada galvanizada, curvas, uniones y soportes colgantes',
    items: [
      { name: 'Bandeja portacables perforada 100x50x3000mm galvanizada', brand: 'Fixopar', unit: 'tira', defaultQty: 4, cost: 125000, provider: 'FIXOPAR S.A.' },
      { name: 'Curva plana horizontal 90° 100x50mm', brand: 'Fixopar', unit: 'un', defaultQty: 2, cost: 42000, provider: 'FIXOPAR S.A.' },
      { name: 'Juego de placas de unión c/ bulones zincados', brand: 'Fixopar', unit: 'jgo', defaultQty: 6, cost: 18000, provider: 'FIXOPAR S.A.' },
      { name: 'Varilla roscada cincada 3/8" x 3m', brand: 'Fixopar', unit: 'un', defaultQty: 4, cost: 28000, provider: 'FIXOPAR S.A.' },
      { name: 'Tarugo metálico de expansión 3/8"', brand: 'Fixopar', unit: 'un', defaultQty: 8, cost: 5500, provider: 'FIXOPAR S.A.' },
    ],
  },
  {
    id: 'tpl-iluminacion-led',
    name: 'Iluminación Industrial LED para Nave',
    description: 'Campanas industriales LED 150W IP65, fotocélula y cableado',
    items: [
      { name: 'Campana industrial LED 150W IP65 6500K 19500lm', brand: 'Enerluz', unit: 'un', defaultQty: 6, cost: 240000, provider: 'ENERLUZ S.A.' },
      { name: 'Fotocélula electrónica 220V 10A con base giratoria', brand: 'Electropar', unit: 'un', defaultQty: 1, cost: 65000, provider: 'ELECTROPAR S.A.' },
      { name: 'Cable tipo taller 3x2.5 mm² bobina x 100m', brand: 'Electropar', unit: 'm', defaultQty: 80, cost: 11500, provider: 'ELECTROPAR S.A.' },
      { name: 'Caja de paso estanca IP65 100x100x50mm', brand: 'Fixopar', unit: 'un', defaultQty: 6, cost: 22000, provider: 'FIXOPAR S.A.' },
    ],
  },
];

function NuevoPresupuestoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || searchParams?.get('id');

  const { user: authUser, isAdmin, isSecretaria } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(StorageService.getUserPermissions(null));
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());

  // Paso activo
  const [activeStep, setActiveStep] = useState(1);
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);

  // Listados base
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);

  // 1. Datos Paso 1: Cliente y Trabajo
  const [budgetId, setBudgetId] = useState<string>('');
  const [budgetNumber, setBudgetNumber] = useState('');
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Opciones comerciales adicionales
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [currency, setCurrency] = useState<'PYG' | 'USD'>('PYG');
  const [exchangeRate, setExchangeRate] = useState(7950);
  const [globalMargin, setGlobalMargin] = useState(30);
  const [deliveryTerms, setDeliveryTerms] = useState('Inmediato / Según avance de obra');
  const [paymentTerms, setPaymentTerms] = useState('Anticipo 30%, 40% contra entrega de tableros, 30% contra recepción final');
  const [publicNotes, setPublicNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // 2. Datos Paso 2: Productos y Servicios (Grupos / Rubros)
  const [subgroups, setSubgroups] = useState<QuoteGroup[]>([
    { id: 'grp-1', name: 'Materiales', order: 1, items: [] },
  ]);
  const [activeSubgroupId, setActiveSubgroupId] = useState<string>('grp-1');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [laborLines, setLaborLines] = useState<LaborLine[]>([]);
  const [logisticsLines, setLogisticsLines] = useState<LogisticsLine[]>([]);

  // Modales
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientRuc, setNewClientRuc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('Asunción');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [targetGroupIdForAdd, setTargetGroupIdForAdd] = useState<string>('grp-1');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<CanonicalProduct | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addMargin, setAddMargin] = useState<number>(30);

  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('un');
  const [newProdProvider, setNewProdProvider] = useState('');
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdMargin, setNewProdMargin] = useState<number>(30);

  const [supplierModalItem, setSupplierModalItem] = useState<BudgetItem | null>(null);

  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborDesc, setLaborDesc] = useState('');
  const [laborType, setLaborType] = useState<'hours' | 'fixed'>('hours');
  const [laborHours, setLaborHours] = useState<number>(8);
  const [laborWorkers, setLaborWorkers] = useState<number>(1);
  const [laborHourlyRate, setLaborHourlyRate] = useState<number>(55000);
  const [laborFixedTotal, setLaborFixedTotal] = useState<number>(0);

  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [logisticsConcept, setLogisticsConcept] = useState('Movilidad cuadrilla técnica');
  const [logisticsKm, setLogisticsKm] = useState<number>(50);
  const [logisticsRate, setLogisticsRate] = useState<number>(2500);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');

  // Descuento General
  const [generalDiscountPct, setGeneralDiscountPct] = useState<number>(0);
  const [discountApprovalNotice, setDiscountApprovalNotice] = useState<string | null>(null);

  // Estados de proceso y guardado
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [savedBudget, setSavedBudget] = useState<Budget | null>(null);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [copiedSipap, setCopiedSipap] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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
        setTitle(existing.title || existing.project_name || '');
        setSelectedClientId(existing.client?.id || '');
        setCurrency(existing.currency || 'PYG');
        setExchangeRate(existing.exchange_rate_usd_pyg || 7950);
        setGlobalMargin(existing.global_margin_pct || 30);
        setValidityDays(existing.validity_days || 15);
        setDeliveryTerms(existing.delivery_terms || 'Inmediato / Según avance de obra');
        setPaymentTerms(existing.payment_terms || 'Anticipo 30%, 40% contra entrega de tableros, 30% contra recepción final');
        setPublicNotes(existing.notes || '');
        setInternalNotes(existing.internal_notes || '');
        setSubgroups(existing.subgroups && existing.subgroups.length > 0 ? existing.subgroups : [{ id: 'grp-1', name: 'Materiales', order: 1, items: [] }]);
        setItems(existing.items || []);
        setLaborLines(existing.labor_lines || []);
        setLogisticsLines(existing.logistics_lines || []);
        setSavedBudget(existing);
        setLastSavedTime(formatDatePY(existing.updated_at.split('T')[0]));
        return;
      }
    }

    // Nuevo presupuesto vacío: INICIALIZA CLIENTE VACÍO (Punto 5)
    const allBudgets = StorageService.getBudgets();
    const nextNum = PricingEngine.generateQuoteNumber(allBudgets);
    setBudgetId(`b-${Date.now()}`);
    setBudgetNumber(nextNum);
    setSelectedClientId(''); // Cliente sin selección automática
  }, [editId]);

  // Cliente seleccionado (null si no se ha elegido)
  const currentClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => c.id === selectedClientId) || null;
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

  // Lista filtrada de productos para el modal
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 30);
    const q = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) || 
      (p.internal_code && p.internal_code.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [products, productSearch]);

  // Snapshot para el motor de cálculo
  const currentQuoteSnapshot: Partial<Budget> = {
    budget_number: budgetNumber,
    title: title || 'Presupuesto de Instalación Eléctrica',
    client: currentClient || {
      id: 'cli-temp',
      name: 'Cliente por definir',
      ruc_or_ci: 'Sin RUC',
      phone: '',
      email: '',
      city: 'Asunción',
      address: '',
      is_active: true,
    },
    currency,
    global_margin_pct: globalMargin,
    pricing_method: 'margin',
    items,
    labor_lines: laborLines,
    logistics_lines: logisticsLines,
  };

  // Totales del motor
  const baseTotals = PricingEngine.calculateQuoteTotals(currentQuoteSnapshot, 10);
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

  // VALIDACIÓN REAL DE LOS PASOS (Punto 6)
  const isStep1Valid = Boolean(
    selectedClientId &&
    title.trim() &&
    issueDate &&
    validityDays > 0
  );

  const isStep2Valid = Boolean(
    (items.length > 0 || laborLines.length > 0 || logisticsLines.length > 0) &&
    items.every(i => i.quantity > 0 && (i.unit_sale_pyg || 0) > 0) &&
    (!discountApprovalNotice || !discountApprovalNotice.startsWith('❌'))
  );

  const isStep3Valid = isStep1Valid && isStep2Valid;

  const handleProceedToStep2 = () => {
    setStep1Attempted(true);
    if (!isStep1Valid) {
      return;
    }
    setActiveStep(2);
  };

  const handleProceedToStep3 = () => {
    setStep2Attempted(true);
    if (!isStep2Valid) {
      return;
    }
    setActiveStep(3);
  };

  // --- ACCIÓN: CREAR CLIENTE RÁPIDO SIN PERDER DATOS (Punto 5) ---
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

  // --- ACCIONES DE GRUPOS / RUBROS (Punto 7) ---
  const handleAddGroup = (groupName?: string) => {
    const name = (groupName || newGroupNameInput).trim();
    if (!name) return;
    const newGrp: QuoteGroup = {
      id: `grp-${Date.now()}`,
      name,
      order: subgroups.length + 1,
      items: [],
    };
    setSubgroups([...subgroups, newGrp]);
    setActiveSubgroupId(newGrp.id);
    setNewGroupNameInput('');
    setShowAddGroupModal(false);
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    setSubgroups(subgroups.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleDuplicateGroup = (groupId: string) => {
    const sourceGroup = subgroups.find(g => g.id === groupId);
    if (!sourceGroup) return;

    const newGroupId = `grp-${Date.now()}`;
    const newGroup: QuoteGroup = {
      id: newGroupId,
      name: `${sourceGroup.name} (Copia)`,
      order: subgroups.length + 1,
      items: [],
    };

    const sourceItems = items.filter(it => it.subgroup_id === groupId);
    const duplicatedItems: BudgetItem[] = sourceItems.map((it, idx) => ({
      ...it,
      id: `bi-${Date.now()}-${idx + 1}`,
      subgroup_id: newGroupId,
      hierarchical_number: `${subgroups.length + 1}.${idx + 1}`,
      position: idx + 1,
    }));

    setSubgroups([...subgroups, newGroup]);
    setItems([...items, ...duplicatedItems]);
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupItems = items.filter(it => it.subgroup_id === groupId);
    const group = subgroups.find(g => g.id === groupId);
    if (!confirm(`¿Eliminar el rubro "${group?.name || 'Grupo'}" y sus ${groupItems.length} materiales asociados?`)) {
      return;
    }
    setSubgroups(subgroups.filter(g => g.id !== groupId));
    setItems(items.filter(it => it.subgroup_id !== groupId));
  };

  const saveGroupAsTemplate = (group: QuoteGroup) => {
    const groupItems = items.filter(i => i.subgroup_id === group.id);
    if (groupItems.length === 0) {
      alert('El grupo no tiene productos cargados para guardar como plantilla.');
      return;
    }
    const customTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: group.name,
      description: `${groupItems.length} materiales configurados`,
      items: groupItems.map(it => ({
        name: it.description,
        brand: it.brand || 'Nacional',
        unit: it.unit || 'un',
        defaultQty: it.quantity || 1,
        cost: it.unit_cost_pyg || 0,
        provider: it.provider_name || 'Proveedor General',
      })),
    };
    try {
      const existing = JSON.parse(localStorage.getItem('ec_custom_templates') || '[]');
      existing.push(customTemplate);
      localStorage.setItem('ec_custom_templates', JSON.stringify(existing));
      alert(`Plantilla "${group.name}" guardada con éxito para futuros presupuestos.`);
    } catch {
      alert('No se pudo guardar la plantilla.');
    }
  };

  const handleInsertTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    const newGroupId = `grp-${Date.now()}`;
    const newGroup: QuoteGroup = {
      id: newGroupId,
      name: tpl.name,
      order: subgroups.length + 1,
      items: [],
    };

    const newItems: BudgetItem[] = tpl.items.map((it, idx) => {
      const cost = it.cost;
      const sale = PricingEngine.calculateSalePriceFromMargin(cost, globalMargin);
      return {
        id: `bi-${Date.now()}-${idx + 1}`,
        subgroup_id: newGroupId,
        hierarchical_number: `${subgroups.length + 1}.${idx + 1}`,
        provider_name: (it as any).provider || 'Proveedor General',
        item_type: 'material',
        description: it.name,
        brand: it.brand,
        quantity: it.defaultQty,
        unit: it.unit,
        unit_cost_pyg: cost,
        unit_sale_pyg: sale,
        total_sale_pyg: sale * it.defaultQty,
        margin_pct: globalMargin,
        position: idx + 1,
      };
    });

    setSubgroups([...subgroups, newGroup]);
    setItems([...items, ...newItems]);
    setShowTemplateModal(false);
  };

  // --- ACCIÓN: ABRIR MODAL AGREGAR PRODUCTO CON GRUPO DE DESTINO (Punto 8) ---
  const handleOpenAddProductForGroup = (groupId: string) => {
    setTargetGroupIdForAdd(groupId);
    setActiveSubgroupId(groupId);
    setSelectedProductToAdd(null);
    setProductSearch('');
    setShowProductPicker(true);
  };

  const handleConfirmAddProduct = () => {
    if (!selectedProductToAdd) return;
    const cost = selectedProductToAdd.last_price_pyg || 0;
    const margin = addMargin || globalMargin;
    const unitSaleNet = PricingEngine.calculateSalePriceFromMargin(cost, margin);

    const targetGroup = subgroups.find(g => g.id === targetGroupIdForAdd) || subgroups[0];
    const grpIndex = subgroups.indexOf(targetGroup) + 1;
    const itemsInGroup = items.filter(i => i.subgroup_id === targetGroup.id);

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${items.length + 1}`,
      subgroup_id: targetGroup.id,
      hierarchical_number: `${grpIndex}.${itemsInGroup.length + 1}`,
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
      unit_sale_pyg: unitSaleNet,
      total_sale_pyg: unitSaleNet * (addQuantity || 1),
      margin_pct: margin,
      position: itemsInGroup.length + 1,
      notes: selectedProductToAdd.technical_description || '',
    };

    setItems([...items, newItem]);
    setShowProductPicker(false);
    setSelectedProductToAdd(null);
  };

  const handleUpdateItemQuantity = (id: string, qty: number) => {
    const validQty = Math.max(1, qty);
    setItems(items.map(it => {
      if (it.id === id) {
        return {
          ...it,
          quantity: validQty,
          total_sale_pyg: (it.unit_sale_pyg || 0) * validQty,
        };
      }
      return it;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(it => it.id !== id));
  };

  // --- SELECCIONAR COTIZACIÓN DE PROVEEDOR EN ÍTEM (Punto 8) ---
  const handleSelectSupplierQuote = (providerName: string, pricePyg: number) => {
    if (!supplierModalItem) return;
    const margin = supplierModalItem.margin_pct || globalMargin;
    const newUnitSale = PricingEngine.calculateSalePriceFromMargin(pricePyg, margin);

    setItems(items.map(it => {
      if (it.id === supplierModalItem.id) {
        return {
          ...it,
          provider_name: providerName,
          unit_cost_pyg: pricePyg,
          unit_sale_pyg: newUnitSale,
          total_sale_pyg: newUnitSale * (it.quantity || 1),
        };
      }
      return it;
    }));
    setSupplierModalItem(null);
  };

  // --- MANO DE OBRA Y VIÁTICOS ---
  const handleAddLabor = () => {
    if (!laborDesc.trim()) {
      alert('Ingresa una descripción del servicio.');
      return;
    }
    const totalHours = laborType === 'hours' ? (laborHours * laborWorkers) : 0;
    const cost = laborType === 'hours' ? (totalHours * laborHourlyRate) : laborFixedTotal;
    const margin = 25;
    const sale = PricingEngine.calculateSalePriceFromMargin(cost, margin);

    const newLine: LaborLine = {
      id: `ll-${Date.now()}`,
      method: 'man_hours',
      service_description: laborDesc.trim(),
      worker_count: laborWorkers,
      hours_per_worker: laborHours,
      hourly_rate_pyg: laborHourlyRate,
      total_pyg: sale,
      is_included_in_quote: true,
    };

    setLaborLines([...laborLines, newLine]);
    setShowLaborModal(false);
    setLaborDesc('');
  };

  const handleAddLogistics = () => {
    const cost = logisticsKm * logisticsRate;
    const newLine: LogisticsLine = {
      id: `log-${Date.now()}`,
      concept_type: 'km_mobility',
      description: `${logisticsConcept.trim()} (${logisticsKm} km)`,
      calculation_type: 'per_km',
      quantity: logisticsKm,
      unit: 'km',
      unit_rate_pyg: logisticsRate,
      cost_pyg: cost,
      margin_pct: 0,
      sale_price_pyg: cost,
      is_included_in_quote: true,
    };

    setLogisticsLines([...logisticsLines, newLine]);
    setShowLogisticsModal(false);
  };

  // --- GUARDADO REAL Y CONTINUIDAD (Punto 10) ---
  const handleSaveBudget = (status: 'draft' | 'pending_authorization' | 'sent') => {
    setIsSaving(true);
    setSaveStatus('saving');

    // Validación completa para emitir oficialmente
    if (status === 'sent') {
      if (!isStep1Valid || !isStep2Valid) {
        setStep1Attempted(true);
        setStep2Attempted(true);
        setIsSaving(false);
        setSaveStatus('error');
        alert('Para confirmar y emitir el presupuesto debes completar los datos requeridos del Paso 1 (Cliente y trabajo) y Paso 2 (materiales o servicios válidos).');
        return;
      }
    }

    try {
      const finalStatus = (generalDiscountPct > 20 && isSecretaria) ? 'pending_authorization' : status;
      const newBudget: Budget = {
        id: budgetId || `b-${Date.now()}`,
        budget_number: budgetNumber,
        title: title.trim() || 'Presupuesto de Instalación Eléctrica',
        project_name: title.trim() || 'Presupuesto de Instalación Eléctrica',
        client: currentClient || {
          id: 'cli-sin-asignar',
          name: 'Cliente sin asignar',
          ruc_or_ci: 'Sin RUC',
          phone: '',
          email: '',
          city: 'Asunción',
          address: '',
          is_active: true,
        },
        status: finalStatus,
        is_archived: false,
        version: savedBudget ? (savedBudget.version || 1) : 1,
        current_revision: savedBudget ? (savedBudget.current_revision || 1) : 1,
        revisions: savedBudget?.revisions || [],
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
        created_at: savedBudget?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      StorageService.saveBudget(newBudget);
      setSavedBudget(newBudget);
      setIsSaving(false);
      setSaveStatus('saved');
      const nowTime = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(nowTime);

      if (finalStatus === 'pending_authorization') {
        alert(`Presupuesto ${newBudget.budget_number} guardado. Al tener un descuento del ${generalDiscountPct}%, quedó como "Pendiente de Autorización" de Lucas Duré.`);
      } else if (status === 'sent') {
        alert(`¡Presupuesto ${newBudget.budget_number} confirmado y emitido con éxito!`);
      } else {
        alert(`Presupuesto ${newBudget.budget_number} guardado correctamente como Borrador a las ${nowTime}.`);
      }
    } catch (err: any) {
      setIsSaving(false);
      setSaveStatus('error');
      alert('Error al guardar el presupuesto: ' + (err.message || 'Error de persistencia'));
    }
  };

  // --- DESCARGA DE DOCUMENTOS PDF (Punto 12) ---
  const handleDownloadPDF = async (type: 'client' | 'materials' | 'internal') => {
    try {
      setDownloadingType(type);
      const budgetForExport: Budget = savedBudget || {
        ...currentQuoteSnapshot,
        id: budgetId || `temp-${Date.now()}`,
        budget_number: budgetNumber,
        title: title || 'Presupuesto de Instalación Eléctrica',
        project_name: title || 'Presupuesto de Instalación Eléctrica',
        client: currentClient || {
          id: 'cli-sin-asignar',
          name: 'Cliente sin asignar',
          ruc_or_ci: 'Sin RUC',
          phone: '',
          email: '',
          city: 'Asunción',
          address: '',
          is_active: true,
        },
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

      const clientNameSafe = (budgetForExport.client.name || 'Cliente').replace(/\s+/g, '_');

      if (type === 'client') {
        const doc = await generateClientPDF(budgetForExport, settings);
        doc.save(`Presupuesto_${budgetForExport.budget_number}_${clientNameSafe}.pdf`);
      } else if (type === 'materials') {
        const doc = await generateMaterialsListPDF(budgetForExport, settings);
        doc.save(`Lista_Materiales_${budgetForExport.budget_number}.pdf`);
      } else if (type === 'internal') {
        if (!isAdmin) {
          alert('Solo el Administrador tiene autorización para descargar el resumen interno de costos y márgenes.');
          return;
        }
        const doc = await generateInternalCostSummaryPDF(budgetForExport, settings);
        doc.save(`Resumen_Costos_${budgetForExport.budget_number}_CONFIDENCIAL.pdf`);
      }
    } catch (err) {
      console.error('Error generando PDF', err);
      alert('Ocurrió un error al generar el documento PDF.');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*PRESUPUESTO ELÉCTRICO* ⚡\n*Construlogica Emprendimientos S.A.*\n\n*Cliente:* ${currentClient?.name || 'Cliente'}\n*Presupuesto:* ${budgetNumber}\n*Total:* ${formatPYG(totalBudget)} (IVA 10% incluido)\n*Validez:* ${validityDays} días\n\n_Generado por ElectroCotiza._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopySipap = () => {
    const text = `*DATOS PARA TRANSFERENCIA SIPAP*\nEmpresa: ${settings.company_name}\nRUC: ${settings.ruc}\nBanco: ${settings.bank_name || 'Banco Itaú Paraguay'}\nCta Cte: ${settings.bank_account_number || '720014589'}\nAlias SIPAP: ${settings.bank_sipap_alias || 'construlogica.py'}`;
    navigator.clipboard.writeText(text);
    setCopiedSipap(true);
    setTimeout(() => setCopiedSipap(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      
      {/* BARRA SUPERIOR CON ESTADO, INDICADORES DE GUARDADO Y ACCIONES */}
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
                {savedBudget?.status === 'sent' ? 'Emitido' : 'Borrador'}
              </span>

              {/* Indicador de persistencia real */}
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  <span>Guardando...</span>
                </span>
              )}
              {saveStatus === 'saved' && lastSavedTime && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Guardado {lastSavedTime}</span>
                </span>
              )}
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
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Guardar borrador</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleSaveBudget('sent')}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar y emitir</span>
          </button>
        </div>
      </div>

      {/* ASISTENTE SIMPLIFICADO DE 3 PASOS CON VALIDACIÓN REAL (Punto 6) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {WIZARD_STEPS.map((s) => {
            const isActive = activeStep === s.step;
            const isCompleted = s.step === 1 ? isStep1Valid : s.step === 2 ? isStep2Valid : isStep3Valid;
            const hasError = (s.step === 1 && step1Attempted && !isStep1Valid) || (s.step === 2 && step2Attempted && !isStep2Valid);

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-all ${
                  isActive 
                    ? 'bg-blue-900 text-white shadow-sm' 
                    : hasError
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 hover:bg-rose-100/70'
                    : isCompleted 
                    ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-900 hover:bg-emerald-50' 
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  isActive 
                    ? 'bg-amber-400 text-slate-950' 
                    : hasError
                    ? 'bg-rose-600 text-white'
                    : isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {hasError ? '!' : isCompleted ? '✓' : s.step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    {s.title}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-200' : hasError ? 'text-rose-600' : 'text-slate-500'}`}>
                    {hasError ? 'Datos pendientes requeridos' : s.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* PASO 1: CLIENTE Y TRABAJO (SIN SELECCIÓN AUTOMÁTICA - Punto 5) */}
      {/* ============================================================= */}
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
            
            {/* SELECTOR DE CLIENTE (SIN SELECCIÓN POR DEFECTO) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="text-xs text-blue-700 font-bold hover:underline flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Agregar nuevo cliente</span>
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
                  className={`w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    step1Attempted && !selectedClientId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Buscar o seleccionar cliente --</option>
                  {filteredClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.ruc_or_ci ? `(RUC: ${c.ruc_or_ci})` : ''} - {c.city || 'Asunción'}
                    </option>
                  ))}
                </select>
              </div>

              {step1Attempted && !selectedClientId && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Debes seleccionar un cliente para este presupuesto.</span>
                </p>
              )}

              {/* Ficha del cliente seleccionado */}
              {currentClient ? (
                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs text-slate-700 flex items-center justify-between mt-2">
                  <div>
                    <span className="font-bold text-blue-950 block text-sm">{currentClient.name}</span>
                    <span className="text-[11px] text-slate-600 font-mono">RUC: {currentClient.ruc_or_ci || 'Sin RUC'} • {currentClient.city || 'Asunción'}</span>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="block font-semibold text-slate-800">{currentClient.phone || 'Sin teléfono'}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedClientId('')}
                      className="text-blue-700 hover:underline font-bold mt-0.5 block"
                    >
                      Cambiar cliente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-400 mt-2">
                  Ningún cliente seleccionado. Elige uno del desplegable o pulsa en <strong>+ Agregar nuevo cliente</strong>.
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
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  step1Attempted && !title.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {step1Attempted && !title.trim() ? (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Debes ingresar el nombre o descripción del trabajo a cotizar.</span>
                </p>
              ) : (
                <span className="text-[10px] text-slate-400 block">
                  Este nombre aparecerá en la cabecera del presupuesto que verá el cliente.
                </span>
              )}
            </div>

            {/* FECHA Y VALIDEZ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Fecha de emisión *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Validez de la oferta (días) *</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={validityDays}
                    onChange={e => setValidityDays(Number(e.target.value) || 15)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-xs text-slate-500 font-semibold">días</span>
                </div>
              </div>
            </div>

            {/* PLAZOS Y CONDICIONES COMERCIALES */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Plazo de entrega</label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={e => setDeliveryTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Condición de pago</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

          </div>

          {/* BOTÓN CONTINUAR AL PASO 2 */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center space-x-2 transition-all shadow-sm"
            >
              <span>Continuar a Productos y Servicios</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 2: PRODUCTOS Y SERVICIOS (CON GRUPOS Y PLANTILLAS - P. 7) */}
      {/* ============================================================= */}
      {activeStep === 2 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-800" />
                <span>Paso 2: Productos, Rubros y Servicios</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organiza los materiales por rubros (Tablero general, Canalizaciones, etc.), agrega mano de obra y viáticos.
              </p>
            </div>

            {/* BOTONES DE AGREGAR Y PLANTILLAS */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddProductForGroup(subgroups[0]?.id || 'grp-1')}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Agregar producto</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddGroupModal(true)}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-lg flex items-center space-x-1.5 border border-blue-200 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>+ Nuevo grupo / rubro</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-lg flex items-center space-x-1.5 border border-amber-300 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Insertar plantilla</span>
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

          {/* VALIDACIÓN PASO 2 SI HUBIERON ERRORES */}
          {step2Attempted && !isStep2Valid && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Debes agregar al menos un material o servicio con cantidad y precio válido para continuar.</span>
            </div>
          )}

          {/* LISTADO DE GRUPOS / RUBROS (ORGANIZACIÓN TÉCNICA - Punto 7) */}
          <div className="space-y-4">
            {subgroups.map((grp, grpIdx) => {
              const grpItems = items.filter(it => it.subgroup_id === grp.id);
              const isCollapsed = collapsedGroups[grp.id] || false;
              const grpSubtotal = grpItems.reduce((acc, it) => acc + (it.total_sale_pyg || 0), 0);

              return (
                <div key={grp.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {/* Cabecera del Grupo / Rubro */}
                  <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapse(grp.id)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                        title={isCollapsed ? 'Expandir grupo' : 'Contraer grupo'}
                      >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      <span className="w-6 h-6 rounded-md bg-blue-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {grpIdx + 1}
                      </span>

                      <input
                        type="text"
                        value={grp.name}
                        onChange={(e) => handleRenameGroup(grp.id, e.target.value)}
                        className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-blue-600 focus:bg-white px-1 py-0.5 rounded outline-none"
                        placeholder="Nombre del rubro..."
                      />

                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {grpItems.length} {grpItems.length === 1 ? 'material' : 'materiales'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-800">
                        Subtotal: {formatPYG(grpSubtotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenAddProductForGroup(grp.id)}
                        className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>+ Agregar material</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateGroup(grp.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"
                        title="Duplicar este grupo con sus materiales"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => saveGroupAsTemplate(grp)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-200 rounded"
                        title="Guardar este grupo como plantilla"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>

                      {subgroups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(grp.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Eliminar este grupo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabla de ítems del grupo */}
                  {!isCollapsed && (
                    <div className="p-3">
                      {grpItems.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                          <p>No hay materiales en este rubro.</p>
                          <button
                            type="button"
                            onClick={() => handleOpenAddProductForGroup(grp.id)}
                            className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar primer producto a {grp.name}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-[11px] font-bold text-slate-600 bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="py-2 px-2.5 text-center w-12">#</th>
                                <th className="py-2 px-3">Producto / Material</th>
                                <th className="py-2 px-3">Proveedor & Cotización</th>
                                <th className="py-2 px-3 text-right">Precio Unit. (Neto)</th>
                                <th className="py-2 px-3 text-center w-20">Cant.</th>
                                <th className="py-2 px-3 text-right">Subtotal Neto</th>
                                <th className="py-2 px-2 text-center w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grpItems.map((it, itemIdx) => (
                                <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-500 text-[11px]">
                                    {grpIdx + 1}.{itemIdx + 1}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="font-bold text-slate-900 block">{it.description}</span>
                                    <span className="text-[10px] text-slate-500">Marca: {it.brand || 'Nacional'} • Unidad: {it.unit}</span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {it.provider_name || 'Proveedor general'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setSupplierModalItem(it)}
                                        className="text-[10px] font-bold text-blue-700 hover:underline"
                                        title="Consultar ofertas y elegir otro proveedor"
                                      >
                                        Elegir precio
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                    {formatPYG(it.unit_sale_pyg)}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <input
                                      type="number"
                                      min={1}
                                      value={it.quantity}
                                      onChange={(e) => handleUpdateItemQuantity(it.id, Number(e.target.value) || 1)}
                                      className="w-16 px-1.5 py-1 text-center font-mono font-bold border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                    {formatPYG(it.total_sale_pyg)}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(it.id)}
                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                      title="Eliminar este ítem"
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
                  )}
                </div>
              );
            })}
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

          {/* TOTALES RESUMEN AL FINAL DEL PASO 2 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 space-y-0.5">
              <span>Subtotal Neto: <strong className="font-mono text-slate-900">{formatPYG(baseTotals.subtotalNet)}</strong></span>
              <span className="mx-2">•</span>
              <span>IVA (10%): <strong className="font-mono text-slate-900">{formatPYG(ivaAmount)}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Total Presupuestado (IVA inc.)</span>
              <span className="text-lg font-black text-blue-950 font-mono">{formatPYG(totalBudget)}</span>
            </div>
          </div>

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
              onClick={handleProceedToStep3}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center space-x-2 shadow-sm"
            >
              <span>Revisar y Generar PDF</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 3: REVISIÓN Y GENERACIÓN DE PDF                          */}
      {/* ============================================================= */}
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

            {/* RESUMEN ECONÓMICO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* DESGLOSE POR CONCEPTOS */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Desglose del Presupuesto
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Materiales y Equipos:</span>
                    <span className="font-mono font-bold text-slate-900">{formatPYG(baseTotals.totalMaterialsSale)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Mano de Obra y Servicios:</span>
                    <span className="font-mono font-bold text-slate-900">{formatPYG(baseTotals.totalLaborSale)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Traslados, Fletes y Viáticos:</span>
                    <span className="font-mono font-bold text-slate-900">{formatPYG(baseTotals.totalLogisticsSale)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 font-semibold text-slate-700">
                    <span>Subtotal Neto:</span>
                    <span className="font-mono">{formatPYG(baseTotals.subtotalNet)}</span>
                  </div>

                  {/* DESCUENTO COMERCIAL */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800 flex items-center space-x-1">
                        <Tag className="w-3.5 h-3.5 text-blue-700" />
                        <span>Descuento Comercial (%)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={generalDiscountPct}
                        onChange={e => setGeneralDiscountPct(Math.min(50, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-16 px-2 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                      />
                    </div>

                    {generalDiscountPct > 0 && (
                      <div className="flex justify-between text-rose-700 font-semibold">
                        <span>Importe descontado:</span>
                        <span className="font-mono">- {formatPYG(discountAmount)}</span>
                      </div>
                    )}

                    {discountApprovalNotice && (
                      <div className={`mt-2 p-2.5 rounded-lg text-[11px] leading-tight font-medium ${
                        discountApprovalNotice.startsWith('❌') 
                          ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {discountApprovalNotice}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between py-1.5 border-t border-slate-200 text-slate-600 font-medium">
                    <span>IVA Crédito Fiscal (10%):</span>
                    <span className="font-mono text-slate-800">{formatPYG(ivaAmount)}</span>
                  </div>

                  {/* TOTAL GENERAL */}
                  <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">Total a Facturar:</span>
                    <span className="text-lg font-black text-blue-900 font-mono">{formatPYG(totalBudget)}</span>
                  </div>
                </div>
              </div>

              {/* DATOS DEL CLIENTE Y TÉRMINOS */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h3 className="font-bold text-slate-800 uppercase tracking-wide">
                  Datos del Presupuesto
                </h3>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500 block">Cliente:</span>
                    <strong className="text-slate-900 text-sm">{currentClient?.name || 'Cliente sin asignar'}</strong>
                    <span className="text-[11px] text-slate-500 font-mono block">RUC: {currentClient?.ruc_or_ci || 'Sin RUC'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Trabajo a realizar:</span>
                    <p className="text-slate-800 font-medium">{title || 'Sin descripción'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-500 block">Validez:</span>
                      <strong className="text-slate-800">{validityDays} días</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Entrega:</span>
                      <strong className="text-slate-800">{deliveryTerms}</strong>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 block">Condición de pago:</span>
                    <strong className="text-slate-800 text-[11px]">{paymentTerms}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* SECCIÓN DESCARGA DE DOCUMENTOS PDF (Punto 12) */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-amber-400 flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Descarga de Documentos Oficiales en PDF</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generados según el estándar oficial paraguayo con datos de Construlogica S.A.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Enviar por WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySipap}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                  >
                    {copiedSipap ? '¡Copiado!' : 'Copiar datos SIPAP'}
                  </button>
                </div>
              </div>

              {/* BOTONES DE DOCUMENTOS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={downloadingType !== null}
                  onClick={() => handleDownloadPDF('client')}
                  className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-left transition-all shadow space-y-1 active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Presupuesto Comercial</span>
                    <Download className="w-4 h-4 text-amber-300" />
                  </div>
                  <p className="text-[10px] text-blue-100">
                    Documento formal para el cliente con IVA 10% y cuenta bancaria. Confidencialidad 100%.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={downloadingType !== null}
                  onClick={() => handleDownloadPDF('materials')}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-left transition-all border border-slate-700 space-y-1 active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Lista de Materiales</span>
                    <Download className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Requerimiento técnico para pañol, compras y electricistas. Sin precios comerciales.
                  </p>
                </button>

                {isAdmin ? (
                  <button
                    type="button"
                    disabled={downloadingType !== null}
                    onClick={() => handleDownloadPDF('internal')}
                    className="p-3 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 rounded-xl text-left transition-all border border-amber-800/60 space-y-1 active:scale-95 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Resumen de Costos</span>
                      </span>
                      <Download className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-[10px] text-amber-400/80">
                      Exclusivo Administrador: Auditoría interna, márgenes, rentabilidad y proveedores.
                    </p>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-left opacity-60">
                    <span className="font-bold text-xs text-slate-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Resumen de Costos</span>
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Reservado exclusivamente para el Administrador (Lucas Duré).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES FINALES DE NAVEGACIÓN Y EMISIÓN */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a Productos y Servicios</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSaveBudget('draft')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
                >
                  Guardar como borrador
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBudget('sent')}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Emitir presupuesto oficial</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODALES: CLIENTE, PRODUCTO, PROVEEDOR, MANO DE OBRA, GRUPOS  */}
      {/* ============================================================= */}

      {/* MODAL 1: AGREGAR NUEVO CLIENTE (Punto 5) */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <UserPlus className="w-4 h-4 text-blue-700" />
                <span>Agregar Nuevo Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Ej: Agroganadera Santa Rita S.A."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">RUC o C.I.</label>
                  <input
                    type="text"
                    value={newClientRuc}
                    onChange={e => setNewClientRuc(e.target.value)}
                    placeholder="80012345-6"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    placeholder="0981 ..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Ciudad</label>
                  <input
                    type="text"
                    value={newClientCity}
                    onChange={e => setNewClientCity(e.target.value)}
                    placeholder="Asunción, CDE..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Dirección / Obra</label>
                  <input
                    type="text"
                    value={newClientAddress}
                    onChange={e => setNewClientAddress(e.target.value)}
                    placeholder="Av. Principal km 8"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
                Guardar y seleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BUSCADOR Y AGREGADOR DE PRODUCTOS (Punto 8) */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">Agregar Producto al Presupuesto</h3>
                <p className="text-xs text-slate-500">
                  Destino: <strong className="text-blue-900">{subgroups.find(g => g.id === targetGroupIdForAdd)?.name || 'Materiales'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductPicker(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grupo de destino selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Agregar en rubro:</span>
              <select
                value={targetGroupIdForAdd}
                onChange={e => setTargetGroupIdForAdd(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1"
              >
                {subgroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Buscador de catálogo */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                autoFocus
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar por nombre, código, marca o modelo (ej: cable 4mm, termomagnética 20A, bandeja)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Lista de resultados */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-60 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {filteredProducts.map(prod => {
                const isSelected = selectedProductToAdd?.id === prod.id;
                const salePrice = PricingEngine.calculateSalePriceFromMargin(prod.last_price_pyg || 0, globalMargin);

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setSelectedProductToAdd(prod);
                      setAddMargin(globalMargin);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{prod.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Marca: {prod.brand || 'Nacional'} • Prov: {prod.last_provider_name || 'General'}
                        {prod.last_price_date && ` (${formatDatePY(prod.last_price_date)})`}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-blue-900 text-xs block">{formatPYG(salePrice)}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Costo: {formatPYG(prod.last_price_pyg || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cantidad y confirmación */}
            {selectedProductToAdd && (
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div>
                    <label className="text-[11px] font-bold text-blue-900 block">Cantidad ({selectedProductToAdd.unit}):</label>
                    <input
                      type="number"
                      min={1}
                      value={addQuantity}
                      onChange={e => setAddQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-blue-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-blue-900 block">Margen (%):</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={addMargin}
                      onChange={e => setAddMargin(Number(e.target.value) || 30)}
                      className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-blue-300 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAddProduct}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Agregar al grupo</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowProductPicker(false);
                  setShowCreateProductModal(true);
                }}
                className="text-xs text-blue-700 font-bold hover:underline flex items-center space-x-1"
              >
                <span>¿No encuentras el producto? + Crear nuevo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProductPicker(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ELEGIR PROVEEDOR / PRECIO PARA ÍTEM (Punto 8) */}
      {supplierModalItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Elegir cotización y proveedor</h3>
                <p className="text-xs text-slate-500 font-medium">{supplierModalItem.description}</p>
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
              <span className="text-xs font-bold text-slate-700 block">Cotizaciones registradas en catálogo:</span>
              
              {(() => {
                const prod = products.find(p => p.id === supplierModalItem.canonical_product_id);
                const history = prod?.history || [];

                if (history.length === 0) {
                  return (
                    <div className="bg-slate-50 p-4 rounded-xl text-center text-xs text-slate-500">
                      Este material tiene una única cotización registrada ({supplierModalItem.provider_name || 'Proveedor general'}).
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {history.map(h => {
                      const margin = supplierModalItem.margin_pct || globalMargin;
                      const salePrice = PricingEngine.calculateSalePriceFromMargin(h.price_pyg, margin);
                      const isSelected = supplierModalItem.provider_name === h.provider_name && supplierModalItem.unit_cost_pyg === h.price_pyg;

                      return (
                        <div
                          key={h.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                            isSelected ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-slate-900">{h.provider_name}</span>
                              {isPriceStale(h.date) && (
                                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                                  &gt; 60 días
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Cotizado: {formatDatePY(h.date)} • Costo compra: <strong className="font-mono text-slate-800">{formatPYG(h.price_pyg)}</strong>
                            </div>
                            <div className="text-[11px] text-blue-900 font-semibold mt-0.5">
                              Precio venta sugerido: <strong className="font-mono">{formatPYG(salePrice)}</strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isSelected}
                            onClick={() => handleSelectSupplierQuote(h.provider_name, h.price_pyg)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                              isSelected 
                                ? 'bg-emerald-600 text-white cursor-default' 
                                : 'bg-blue-900 hover:bg-blue-800 text-white shadow-sm'
                            }`}
                          >
                            {isSelected ? 'Seleccionado' : 'Elegir precio'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
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

      {/* MODAL 4: AGREGAR NUEVO GRUPO / RUBRO (Punto 7) */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>Agregar Nuevo Rubro o Subgrupo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nombre del rubro:</label>
                <input
                  type="text"
                  autoFocus
                  value={newGroupNameInput}
                  onChange={e => setNewGroupNameInput(e.target.value)}
                  placeholder="Ej: Tablero Principal, Iluminación, Acometida..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Sugerencias comunes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Tablero General', 'Canalizaciones', 'Iluminación Industrial', 'Puesta a Tierra', 'Automatización y Control', 'Acometida Eléctrica'].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddGroup(sug)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAddGroup()}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Crear rubro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: INSERTAR DESDE PLANTILLA ELÉCTRICA (Punto 7) */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  <span>Insertar Módulo desde Plantilla Eléctrica</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agrega conjuntos pre-armados típicos. Podrás ajustar cantidades y precios libremente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {PRESET_TEMPLATES.map(tpl => (
                <div key={tpl.id} className="p-4 border border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 hover:bg-blue-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">{tpl.name}</span>
                    <p className="text-xs text-slate-500">{tpl.description}</p>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {tpl.items.length} materiales incluidos ({tpl.items.map(i => i.name.split(' ')[0]).join(', ')}...)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInsertTemplate(tpl)}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm shrink-0 flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Insertar rubro</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: AGREGAR MANO DE OBRA */}
      {showLaborModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <Wrench className="w-4 h-4 text-blue-700" />
                <span>Agregar Servicio de Mano de Obra</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLaborModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Descripción del trabajo *</label>
                <input
                  type="text"
                  value={laborDesc}
                  onChange={e => setLaborDesc(e.target.value)}
                  placeholder="Ej: Montaje mecánico de bandejas, peinado de tableros..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Cantidad operarios</label>
                  <input
                    type="number"
                    min={1}
                    value={laborWorkers}
                    onChange={e => setLaborWorkers(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Horas estimadas</label>
                  <input
                    type="number"
                    min={1}
                    value={laborHours}
                    onChange={e => setLaborHours(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Tarifa horaria por operario (Gs.)</label>
                <input
                  type="number"
                  value={laborHourlyRate}
                  onChange={e => setLaborHourlyRate(Number(e.target.value) || 55000)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
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

      {/* MODAL 7: AGREGAR TRASLADO / VIÁTICO */}
      {showLogisticsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-slate-700" />
                <span>Agregar Traslado o Viático</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLogisticsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Concepto logístico</label>
                <input
                  type="text"
                  value={logisticsConcept}
                  onChange={e => setLogisticsConcept(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Distancia (km)</label>
                  <input
                    type="number"
                    value={logisticsKm}
                    onChange={e => setLogisticsKm(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Tarifa por km (Gs.)</label>
                  <input
                    type="number"
                    value={logisticsRate}
                    onChange={e => setLogisticsRate(Number(e.target.value) || 2500)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
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

    </div>
  );
}

export default function NuevoPresupuestoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    }>
      <NuevoPresupuestoContent />
    </Suspense>
  );
}

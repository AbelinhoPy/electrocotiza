'use client';

import {
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
  INITIAL_CLIENTS,
  INITIAL_INVOICES,
  INITIAL_PRODUCTS,
  INITIAL_PROVIDERS,
  INITIAL_SETTINGS,
  INITIAL_USER,
  DEMO_USERS,
  INITIAL_SERVICES,
  INITIAL_WAREHOUSES,
  INITIAL_STOCKS,
  INITIAL_INVENTORY_MOVEMENTS,
  INITIAL_PROJECTS,
  INITIAL_SERVICE_ORDERS,
  INITIAL_CHECKLIST_TEMPLATES,
  INITIAL_CHECKLIST_EXECUTIONS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_PAYMENT_MILESTONES,
  INITIAL_PROJECT_EXPENSES,
} from './initial-data';
import {
  Budget,
  BudgetItem,
  CanonicalProduct,
  Category,
  Client,
  IngestedInvoice,
  PriceRecord,
  Provider,
  CompanySettings,
  Settings,
  UserProfile,
  UserPermissions,
  CatalogService,
  Warehouse,
  InventoryStock,
  InventoryMovement,
  Project,
  ProjectMaterial,
  ServiceOrder,
  ChecklistTemplate,
  ChecklistExecution,
  AuditEvent,
  QuoteStatus,
  QuoteRevision,
  DiscountApprovalRequest,
  ProjectPaymentMilestone,
  ProjectExpense,
} from '../types';
import { matchScore, normalizeText } from '../fuzzy';
import { PricingEngine } from '../pricing-engine';

const STORAGE_KEYS = {
  PRODUCTS: 'electrocotiza_products_v2',
  BUDGETS: 'electrocotiza_budgets_v2',
  CLIENTS: 'electrocotiza_clients_v2',
  PROVIDERS: 'electrocotiza_providers_v2',
  CATEGORIES: 'electrocotiza_categories_v2',
  INVOICES: 'electrocotiza_invoices_v2',
  SETTINGS: 'electrocotiza_settings_v2',
  USER: 'electrocotiza_current_user_v2',
  SERVICES: 'electrocotiza_services_v2',
  WAREHOUSES: 'electrocotiza_warehouses_v2',
  STOCKS: 'electrocotiza_stocks_v2',
  MOVEMENTS: 'electrocotiza_movements_v2',
  PROJECTS: 'electrocotiza_projects_v2',
  SERVICE_ORDERS: 'electrocotiza_service_orders_v2',
  CHECKLIST_TEMPLATES: 'electrocotiza_chk_templates_v2',
  CHECKLIST_EXECUTIONS: 'electrocotiza_chk_executions_v2',
  AUDIT_EVENTS: 'electrocotiza_audit_events_v2',
  MILESTONES: 'electrocotiza_milestones_v2',
  EXPENSES: 'electrocotiza_expenses_v2',
};

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

export const StorageService = {
  // --- 1. AUTH, USUARIOS Y ROLES (RBAC) ---
  getCurrentUser(): UserProfile | null {
    return getLocal<UserProfile | null>(STORAGE_KEYS.USER, INITIAL_USER);
  },
  setCurrentUser(user: UserProfile): void {
    setLocal(STORAGE_KEYS.USER, user);
  },
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  isAuthenticated(): boolean {
    return Boolean(this.getCurrentUser());
  },
  getUsers(): UserProfile[] {
    return DEMO_USERS;
  },

  getUserPermissions(user?: UserProfile | null): UserPermissions {
    const current = user || this.getCurrentUser();
    if (!current) {
      return {
        canViewCosts: false,
        canEditBudgets: false,
        canApproveDiscounts: false,
        canManageProjects: false,
        canManageInventory: false,
        canManageClients: false,
        canManageUsers: false,
      };
    }

    const role = current.role;
    if (role === 'admin' || role === 'owner') {
      return {
        canViewCosts: true,
        canEditBudgets: true,
        canApproveDiscounts: true,
        canManageProjects: true,
        canManageInventory: true,
        canManageClients: true,
        canManageUsers: true,
      };
    }
    if (role === 'presupuestista') {
      return {
        canViewCosts: true,
        canEditBudgets: true,
        canApproveDiscounts: false,
        canManageProjects: false,
        canManageInventory: false,
        canManageClients: true,
        canManageUsers: false,
      };
    }
    if (role === 'vendedor') {
      return {
        canViewCosts: false, // Confidencialidad
        canEditBudgets: true,
        canApproveDiscounts: false,
        canManageProjects: false,
        canManageInventory: false,
        canManageClients: true,
        canManageUsers: false,
      };
    }
    if (role === 'tecnico' || role === 'electrician') {
      return {
        canViewCosts: false,
        canEditBudgets: false,
        canApproveDiscounts: false,
        canManageProjects: true,
        canManageInventory: true,
        canManageClients: false,
        canManageUsers: false,
      };
    }
    // consulta
    return {
      canViewCosts: false,
      canEditBudgets: false,
      canApproveDiscounts: false,
      canManageProjects: false,
      canManageInventory: false,
      canManageClients: false,
      canManageUsers: false,
    };
  },

  // --- 2. CONFIGURACIÓN DE EMPRESA Y COMERCIAL ---
  getSettings(): CompanySettings {
    return getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: CompanySettings): void {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    this.logAuditEvent({
      event_type: 'quote_status_changed',
      entity: 'CompanySettings',
      entity_id: 'org-main',
      user_name: this.getCurrentUser()?.full_name || 'Admin',
      details: 'Configuración comercial de la empresa actualizada.',
    });
  },

  // --- 3. AUDITORÍA Y TRAZABILIDAD ---
  getAuditEvents(): AuditEvent[] {
    return getLocal(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS);
  },
  logAuditEvent(event: Omit<AuditEvent, 'id' | 'created_at'>): void {
    const events = this.getAuditEvents();
    const newEvent: AuditEvent = {
      ...event,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    setLocal(STORAGE_KEYS.AUDIT_EVENTS, [newEvent, ...events.slice(0, 999)]);
  },

  // --- 4. CLIENTES ---
  getClients(): Client[] {
    return getLocal(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  },
  getClientById(id: string): Client | undefined {
    return this.getClients().find(c => c.id === id);
  },
  saveClient(client: Client): void {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx >= 0) {
      clients[idx] = { ...client, updated_at: new Date().toISOString() };
    } else {
      clients.unshift({ ...client, created_at: new Date().toISOString() });
    }
    setLocal(STORAGE_KEYS.CLIENTS, clients);
  },
  toggleClientActive(id: string): void {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) {
      clients[idx].is_active = !clients[idx].is_active;
      setLocal(STORAGE_KEYS.CLIENTS, clients);
    }
  },

  // --- 5. PROVEEDORES ---
  getProviders(): Provider[] {
    return getLocal(STORAGE_KEYS.PROVIDERS, INITIAL_PROVIDERS);
  },
  getProviderById(id: string): Provider | undefined {
    return this.getProviders().find(p => p.id === id);
  },
  saveProvider(provider: Provider): void {
    const providers = this.getProviders();
    const idx = providers.findIndex(p => p.id === provider.id);
    if (idx >= 0) {
      providers[idx] = { ...provider, last_updated: new Date().toISOString() };
    } else {
      providers.unshift({ ...provider, last_updated: new Date().toISOString() });
    }
    setLocal(STORAGE_KEYS.PROVIDERS, providers);
  },
  addProvider(provider: Provider): void {
    this.saveProvider(provider);
  },
  getGeminiApiKey(): string {
    return getLocal('electrocotiza_gemini_api_key', '');
  },
  setGeminiApiKey(key: string): void {
    setLocal('electrocotiza_gemini_api_key', key);
  },
  exportBackupJSON(): string {
    if (typeof window === 'undefined') return '{}';
    const backup: Record<string, any> = {};
    for (const [k, v] of Object.entries(STORAGE_KEYS)) {
      backup[k] = getLocal(v, null);
    }
    return JSON.stringify(backup, null, 2);
  },
  importBackupJSON(jsonStr: string): { success: boolean; message: string; countBudgets?: number } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Operación no disponible fuera del navegador.' };
    }
    try {
      const data = JSON.parse(jsonStr);
      let count = 0;
      for (const [k, v] of Object.entries(STORAGE_KEYS)) {
        if (data[k] !== undefined) {
          setLocal(v, data[k]);
          if (k === 'BUDGETS' && Array.isArray(data[k])) {
            count = data[k].length;
          }
        }
      }
      return { success: true, message: 'Copia de seguridad restaurada correctamente', countBudgets: count };
    } catch (e: any) {
      return { success: false, message: `Error al procesar archivo JSON: ${e.message}` };
    }
  },

  // --- 6. CATEGORÍAS ---
  getCategories(): Category[] {
    return getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  // --- 7. CATÁLOGO DE MATERIALES (CANONICAL PRODUCTS) ---
  getProducts(): CanonicalProduct[] {
    return getLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  getProductById(id: string): CanonicalProduct | undefined {
    return this.getProducts().find(p => p.id === id);
  },
  createProduct(product: CanonicalProduct): void {
    const current = this.getProducts();
    setLocal(STORAGE_KEYS.PRODUCTS, [product, ...current]);
    this.logAuditEvent({
      event_type: 'price_updated',
      entity: 'CanonicalProduct',
      entity_id: product.id,
      user_name: this.getCurrentUser()?.full_name || 'Sistema',
      details: `Material registrado en catálogo: ${product.name} (SKU: ${product.sku})`,
    });
  },
  updateProduct(product: CanonicalProduct): void {
    const current = this.getProducts();
    const idx = current.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      current[idx] = product;
      setLocal(STORAGE_KEYS.PRODUCTS, current);
    }
  },
  searchProducts(query: string, limit = 20): { product: CanonicalProduct; score: number; matchedAlias?: string }[] {
    const cleanQ = normalizeText(query);
    if (!cleanQ) {
      return this.getProducts().slice(0, limit).map(p => ({ product: p, score: 1.0 }));
    }

    const products = this.getProducts();
    const scored: { product: CanonicalProduct; score: number; matchedAlias?: string }[] = [];

    for (const p of products) {
      let maxScore = matchScore(cleanQ, p.name);
      let bestAlias: string | undefined = undefined;

      for (const alias of p.aliases || []) {
        const aScore = matchScore(cleanQ, alias);
        if (aScore > maxScore) {
          maxScore = aScore;
          bestAlias = alias;
        }
      }

      if (normalizeText(p.sku || p.internal_code || '').includes(cleanQ)) {
        maxScore = Math.max(maxScore, 0.95);
      }

      if (p.brand && normalizeText(p.brand).includes(cleanQ)) {
        maxScore = Math.max(maxScore, 0.85);
      }

      if (maxScore >= 0.25) {
        scored.push({
          product: p,
          score: maxScore,
          matchedAlias: bestAlias,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  },
  suggestForRawText(rawText: string): { product: CanonicalProduct; confidence: number }[] {
    const matches = this.searchProducts(rawText, 3);
    return matches.map(m => ({
      product: m.product,
      confidence: m.score,
    }));
  },
  addAliasToProduct(productId: string, newAlias: string): void {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx >= 0) {
      const p = products[idx];
      const trimmed = newAlias.trim();
      if (!p.aliases.some(a => normalizeText(a) === normalizeText(trimmed))) {
        p.aliases.push(trimmed);
        products[idx] = p;
        setLocal(STORAGE_KEYS.PRODUCTS, products);
      }
    }
  },
  recordPrice(productId: string, priceRecord: Omit<PriceRecord, 'id'>): void {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx >= 0) {
      const p = products[idx];
      const newRecord: PriceRecord = {
        ...priceRecord,
        id: `h-${Date.now()}`,
      };

      p.history = [newRecord, ...(p.history || [])];
      p.last_price_pyg = priceRecord.price_pyg;
      p.last_price_date = priceRecord.date;
      p.last_provider_name = priceRecord.provider_name;

      const prices = p.history.map(h => h.price_pyg);
      p.min_price_pyg = Math.min(...prices);
      p.max_price_pyg = Math.max(...prices);

      products[idx] = p;
      setLocal(STORAGE_KEYS.PRODUCTS, products);

      this.logAuditEvent({
        event_type: 'price_updated',
        entity: 'PriceRecord',
        entity_id: productId,
        user_name: this.getCurrentUser()?.full_name || 'Sistema',
        details: `Nuevo precio registrado para ${p.name}: ${priceRecord.price_pyg.toLocaleString('es-PY')} Gs de ${priceRecord.provider_name}`,
      });
    }
  },

  // --- 8. CATÁLOGO DE SERVICIOS Y TARIFAS ---
  getServices(): CatalogService[] {
    return getLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  },
  saveService(service: CatalogService): void {
    const services = this.getServices();
    const idx = services.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      services[idx] = service;
    } else {
      services.unshift(service);
    }
    setLocal(STORAGE_KEYS.SERVICES, services);
  },

  // --- 9. PRESUPUESTOS (BUDGETS / QUOTES) ---
  getBudgets(): Budget[] {
    return getLocal(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
  },
  getBudgetById(id: string): Budget | undefined {
    return this.getBudgets().find(b => b.id === id);
  },
  saveBudget(budget: Budget): void {
    const current = this.getBudgets();
    const idx = current.findIndex(b => b.id === budget.id);
    if (idx >= 0) {
      current[idx] = { ...budget, updated_at: new Date().toISOString() };
    } else {
      current.unshift({ ...budget, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setLocal(STORAGE_KEYS.BUDGETS, current);
  },
  updateBudget(budget: Budget): void {
    this.saveBudget(budget);
  },
  deleteBudget(id: string): void {
    const filtered = this.getBudgets().filter(b => b.id !== id);
    setLocal(STORAGE_KEYS.BUDGETS, filtered);
  },
  duplicateBudget(id: string): Budget | null {
    const original = this.getBudgetById(id);
    if (!original) return null;

    const allBudgets = this.getBudgets();
    const nextNumber = PricingEngine.generateQuoteNumber(allBudgets);

    const duplicated: Budget = {
      ...original,
      id: `b-${Date.now()}`,
      budget_number: nextNumber,
      title: `${original.title} (Copia)`,
      status: 'draft',
      is_archived: false,
      current_revision: 1,
      revisions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: original.items.map((it, i) => ({
        ...it,
        id: `bi-${Date.now()}-${i}`,
      })),
    };

    this.saveBudget(duplicated);
    return duplicated;
  },

  changeBudgetStatus(budgetId: string, newStatus: QuoteStatus, reason?: string): { success: boolean; message: string } {
    const budget = this.getBudgetById(budgetId);
    if (!budget) return { success: false, message: 'Presupuesto no encontrado.' };

    const oldStatus = budget.status;
    budget.status = newStatus;
    this.saveBudget(budget);

    this.logAuditEvent({
      event_type: 'quote_status_changed',
      entity: 'Budget',
      entity_id: budgetId,
      user_name: this.getCurrentUser()?.full_name || 'Sistema',
      details: `Estado cambiado de "${oldStatus}" a "${newStatus}". ${reason ? `Motivo: ${reason}` : ''}`,
      previous_state: { status: oldStatus },
      new_state: { status: newStatus },
    });

    return { success: true, message: `Estado actualizado a ${newStatus}` };
  },

  toggleArchiveBudget(budgetId: string): void {
    const budget = this.getBudgetById(budgetId);
    if (!budget) return;
    budget.is_archived = !budget.is_archived;
    this.saveBudget(budget);
  },

  requestDiscountApproval(budgetId: string, discountPct: number, reason: string): { success: boolean; message: string } {
    const budget = this.getBudgetById(budgetId);
    if (!budget) return { success: false, message: 'Presupuesto no encontrado.' };

    const user = this.getCurrentUser();
    const request: DiscountApprovalRequest = {
      id: `disc-${Date.now()}`,
      quote_id: budgetId,
      requested_by_user_id: user?.id || 'usr-anon',
      requested_by_name: user?.full_name || 'Vendedor',
      discount_pct: discountPct,
      reason,
      status: 'pending',
    };

    budget.discount_approval = request;
    budget.status = 'pending_authorization';
    this.saveBudget(budget);

    this.logAuditEvent({
      event_type: 'discount_approved',
      entity: 'Budget',
      entity_id: budgetId,
      user_name: user?.full_name || 'Vendedor',
      details: `Solicitud de descuento del ${discountPct}% para presupuesto ${budget.budget_number}. Motivo: ${reason}`,
    });

    return { success: true, message: 'Solicitud enviada a revisión por el Administrador.' };
  },

  approveDiscount(budgetId: string): { success: boolean; message: string } {
    const budget = this.getBudgetById(budgetId);
    if (!budget || !budget.discount_approval) return { success: false, message: 'No hay solicitud pendiente.' };

    const user = this.getCurrentUser();
    budget.discount_approval.status = 'approved';
    budget.discount_approval.approved_by_user_id = user?.id;
    budget.discount_approval.approved_by_name = user?.full_name || 'Administrador';
    budget.discount_approval.approved_at = new Date().toISOString();
    budget.status = 'draft'; // Retorna a borrador listo para emitir
    this.saveBudget(budget);

    this.logAuditEvent({
      event_type: 'discount_approved',
      entity: 'Budget',
      entity_id: budgetId,
      user_name: user?.full_name || 'Administrador',
      details: `Descuento del ${budget.discount_approval.discount_pct}% APROBADO por ${user?.full_name}`,
    });

    return { success: true, message: 'Descuento autorizado con éxito.' };
  },

  emitBudgetRevision(budgetId: string, notes: string = 'Emisión oficial'): QuoteRevision | null {
    const budget = this.getBudgetById(budgetId);
    if (!budget) return null;

    const user = this.getCurrentUser();
    const nextRevNum = (budget.current_revision || 0) + 1;

    // Snapshot inmutable de toda la estructura de costos y precios
    const revision: QuoteRevision = {
      revision_number: nextRevNum,
      created_at: new Date().toISOString(),
      created_by_name: user?.full_name || 'Presupuestista',
      total_sale_pyg: budget.total_sale_pyg,
      total_cost_pyg: budget.total_cost_pyg,
      subtotal_net_pyg: budget.subtotal_net_pyg || budget.total_sale_pyg,
      iva_amount_pyg: budget.iva_amount_pyg,
      summary_notes: notes,
      snapshot_data: JSON.parse(JSON.stringify(budget)),
    };

    budget.current_revision = nextRevNum;
    budget.revisions = [revision, ...(budget.revisions || [])];
    budget.status = 'sent'; // Al emitir pasa a Enviado al cliente
    this.saveBudget(budget);

    this.logAuditEvent({
      event_type: 'quote_revision_emitted',
      entity: 'Budget',
      entity_id: budgetId,
      user_name: user?.full_name || 'Presupuestista',
      details: `Revisión ${nextRevNum} emitida inmutable para ${budget.budget_number}. Total: ${budget.total_sale_pyg.toLocaleString('es-PY')} Gs`,
    });

    return revision;
  },

  // --- 10. CONVERSIÓN A PROYECTO Y SEGUIMIENTO ---
  getProjects(): Project[] {
    return getLocal(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  },
  getProjectById(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id);
  },
  saveProject(project: Project): void {
    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...project, updated_at: new Date().toISOString() };
    } else {
      projects.unshift({ ...project, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setLocal(STORAGE_KEYS.PROJECTS, projects);
  },

  convertBudgetToProject(
    budgetId: string, 
    managerName: string = 'Ramón Fleitas', 
    startDate: string = new Date().toISOString().split('T')[0],
    estimatedEndDate: string = ''
  ): { success: boolean; project?: Project; message: string } {
    const budget = this.getBudgetById(budgetId);
    if (!budget) return { success: false, message: 'Presupuesto no encontrado.' };

    const projects = this.getProjects();
    const nextCode = PricingEngine.generateProjectCode(projects);

    // Mapear materiales previstos
    const materials: ProjectMaterial[] = budget.items
      .filter(i => !i.is_excluded_or_client_provided)
      .map((item, index) => ({
        id: `pm-${Date.now()}-${index}`,
        material_id: item.canonical_product_id || `mat-manual-${index}`,
        description: item.description,
        unit: item.unit,
        quantity_required: item.quantity,
        quantity_received: 0,
        quantity_installed: 0,
        quantity_pending: item.quantity,
        notes: item.notes || 'Requerido según presupuesto aprobado',
      }));

    const newProject: Project = {
      id: `proy-${Date.now()}`,
      code: nextCode,
      name: budget.title || `Proyecto ${budget.budget_number}`,
      quote_id: budget.id,
      quote_number: budget.budget_number,
      client: budget.client,
      manager_name: managerName,
      status: 'en_ejecucion',
      start_date: startDate,
      estimated_end_date: estimatedEndDate || startDate,
      progress_pct: 0,
      total_contract_pyg: budget.total_sale_pyg,
      materials,
      scope_changes: [],
      tasks: budget.schedule_tasks || [],
      notes: `Convertido automáticamente desde Presupuesto ${budget.budget_number}.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.saveProject(newProject);

    // Actualizar estado del presupuesto a Aprobado
    budget.status = 'accepted';
    this.saveBudget(budget);

    this.logAuditEvent({
      event_type: 'project_created',
      entity: 'Project',
      entity_id: newProject.id,
      user_name: this.getCurrentUser()?.full_name || 'Sistema',
      details: `Proyecto ${nextCode} creado desde Presupuesto ${budget.budget_number} (${budget.client.name})`,
    });

    return {
      success: true,
      project: newProject,
      message: `¡Presupuesto ${budget.budget_number} convertido en Proyecto ${nextCode} exitosamente!`,
    };
  },

  updateProjectMaterialStatus(
    projectId: string, 
    materialId: string, 
    deltaReceived: number, 
    deltaInstalled: number
  ): void {
    const project = this.getProjectById(projectId);
    if (!project) return;

    const mat = project.materials.find(m => m.id === materialId || m.material_id === materialId);
    if (mat) {
      mat.quantity_received = Math.min(mat.quantity_required, (mat.quantity_received || 0) + deltaReceived);
      mat.quantity_installed = Math.min(mat.quantity_received, (mat.quantity_installed || 0) + deltaInstalled);
      mat.quantity_pending = Math.max(0, mat.quantity_required - mat.quantity_received);
      this.saveProject(project);
    }
  },

  // --- 11. INVENTARIO Y ALMACENES ---
  getWarehouses(): Warehouse[] {
    return getLocal(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
  },
  getStocks(): InventoryStock[] {
    return getLocal(STORAGE_KEYS.STOCKS, INITIAL_STOCKS);
  },
  getMovements(): InventoryMovement[] {
    return getLocal(STORAGE_KEYS.MOVEMENTS, INITIAL_INVENTORY_MOVEMENTS);
  },
  recordInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'created_at' | 'movement_number'>): void {
    const movements = this.getMovements();
    const stocks = this.getStocks();
    const count = movements.length + 1;
    const movementNumber = `MOV-2026-${String(count).padStart(4, '0')}`;

    const newMov: InventoryMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      movement_number: movementNumber,
      created_at: new Date().toISOString(),
    };

    // Actualizar o crear stock por material y almacén
    const targetWh = movement.target_warehouse_id || movement.source_warehouse_id || 'wh-asuncion';
    let stockItem = stocks.find(s => s.material_id === movement.material_id && s.warehouse_id === targetWh);

    if (!stockItem) {
      stockItem = {
        id: `stk-${Date.now()}`,
        material_id: movement.material_id,
        warehouse_id: targetWh,
        physical_stock: 0,
        reserved_stock: 0,
        available_stock: 0,
        min_alert_stock: 10,
      };
      stocks.push(stockItem);
    }

    if (movement.movement_type === 'entrada' || movement.movement_type === 'ajuste_positivo') {
      stockItem.physical_stock += movement.quantity;
    } else if (movement.movement_type === 'salida' || movement.movement_type === 'ajuste_negativo') {
      stockItem.physical_stock = Math.max(0, stockItem.physical_stock - movement.quantity);
    } else if (movement.movement_type === 'reserva_proyecto') {
      stockItem.reserved_stock += movement.quantity;
    } else if (movement.movement_type === 'liberacion_reserva') {
      stockItem.reserved_stock = Math.max(0, stockItem.reserved_stock - movement.quantity);
    }

    stockItem.available_stock = Math.max(0, stockItem.physical_stock - stockItem.reserved_stock);

    setLocal(STORAGE_KEYS.MOVEMENTS, [newMov, ...movements]);
    setLocal(STORAGE_KEYS.STOCKS, stocks);

    this.logAuditEvent({
      event_type: 'inventory_moved',
      entity: 'InventoryMovement',
      entity_id: newMov.id,
      user_name: movement.user_name,
      details: `${movement.movement_type.toUpperCase()}: ${movement.quantity} ${movement.unit} de ${movement.material_name}. Motivo: ${movement.reason}`,
    });
  },

  // --- 12. ÓRDENES DE SERVICIO Y CHECKLISTS ---
  getServiceOrders(): ServiceOrder[] {
    return getLocal(STORAGE_KEYS.SERVICE_ORDERS, INITIAL_SERVICE_ORDERS);
  },
  getServiceOrderById(id: string): ServiceOrder | undefined {
    return this.getServiceOrders().find(o => o.id === id);
  },
  saveServiceOrder(order: ServiceOrder): void {
    const orders = this.getServiceOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      orders[idx] = { ...order, updated_at: new Date().toISOString() };
    } else {
      orders.unshift({ ...order, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setLocal(STORAGE_KEYS.SERVICE_ORDERS, orders);
  },

  getChecklistTemplates(): ChecklistTemplate[] {
    return getLocal(STORAGE_KEYS.CHECKLIST_TEMPLATES, INITIAL_CHECKLIST_TEMPLATES);
  },
  getChecklistExecutions(): ChecklistExecution[] {
    return getLocal(STORAGE_KEYS.CHECKLIST_EXECUTIONS, INITIAL_CHECKLIST_EXECUTIONS);
  },
  saveChecklistExecution(execution: ChecklistExecution): void {
    const list = this.getChecklistExecutions();
    list.unshift(execution);
    setLocal(STORAGE_KEYS.CHECKLIST_EXECUTIONS, list);
  },

  // --- 13. INGESTA / FACTURAS ---
  getInvoices(): IngestedInvoice[] {
    return getLocal(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },
  getInvoiceById(id: string): IngestedInvoice | undefined {
    return this.getInvoices().find(inv => inv.id === id);
  },
  saveInvoice(invoice: IngestedInvoice): void {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      invoices[idx] = invoice;
    } else {
      invoices.unshift(invoice);
    }
    setLocal(STORAGE_KEYS.INVOICES, invoices);
  },
  approveInvoiceItem(invoiceId: string, itemId: string, canonicalProductId: string): void {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return;

    const item = invoice.items.find(it => it.id === itemId);
    if (!item) return;

    this.addAliasToProduct(canonicalProductId, item.raw_description);
    this.recordPrice(canonicalProductId, {
      canonical_product_id: canonicalProductId,
      provider_id: invoice.provider_id,
      provider_name: invoice.provider_name,
      price_pyg: item.unit_cost_pyg,
      date: invoice.issue_date,
      includes_iva: true,
      iva_rate_pct: 10,
      currency: 'PYG',
      source_type: 'invoice_photo',
      source_ref: `Factura ${invoice.invoice_number}`,
      notes: `Aprobado desde revisión de factura ${invoice.invoice_number}`,
    });

    item.is_confirmed = true;
    item.suggested_canonical_id = canonicalProductId;
    this.saveInvoice(invoice);
  },

  // --- 14. FINANZAS / HITOS Y GASTOS DE PROYECTO ---
  getPaymentMilestones(projectId?: string): ProjectPaymentMilestone[] {
    const list = getLocal(STORAGE_KEYS.MILESTONES, INITIAL_PAYMENT_MILESTONES);
    if (!projectId) return list;
    return list.filter(m => m.project_id === projectId);
  },
  savePaymentMilestone(milestone: ProjectPaymentMilestone): void {
    const list = this.getPaymentMilestones();
    const idx = list.findIndex(m => m.id === milestone.id);
    if (idx >= 0) {
      list[idx] = milestone;
    } else {
      list.push(milestone);
    }
    setLocal(STORAGE_KEYS.MILESTONES, list);
  },
  getProjectExpenses(projectId?: string): ProjectExpense[] {
    const list = getLocal(STORAGE_KEYS.EXPENSES, INITIAL_PROJECT_EXPENSES);
    if (!projectId) return list;
    return list.filter(e => e.project_id === projectId);
  },
  saveProjectExpense(expense: ProjectExpense): void {
    const list = this.getProjectExpenses();
    const idx = list.findIndex(e => e.id === expense.id);
    if (idx >= 0) {
      list[idx] = expense;
    } else {
      list.unshift(expense);
    }
    setLocal(STORAGE_KEYS.EXPENSES, list);
  },

  // --- 15. RESET FACTORY ---
  resetToInitialData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.PROVIDERS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.WAREHOUSES);
    localStorage.removeItem(STORAGE_KEYS.STOCKS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SERVICE_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.CHECKLIST_TEMPLATES);
    localStorage.removeItem(STORAGE_KEYS.CHECKLIST_EXECUTIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_EVENTS);
    localStorage.removeItem(STORAGE_KEYS.MILESTONES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  },
};

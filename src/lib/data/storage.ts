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
  Settings,
  UserProfile,
} from '../types';
import { matchScore, normalizeText } from '../fuzzy';

const STORAGE_KEYS = {
  PRODUCTS: 'electrocotiza_products_v1',
  BUDGETS: 'electrocotiza_budgets_v1',
  CLIENTS: 'electrocotiza_clients_v1',
  PROVIDERS: 'electrocotiza_providers_v1',
  CATEGORIES: 'electrocotiza_categories_v1',
  INVOICES: 'electrocotiza_invoices_v1',
  SETTINGS: 'electrocotiza_settings_v1',
  USER: 'electrocotiza_current_user_v1',
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
  // --- AUTH & USUARIOS ---
  getCurrentUser(): UserProfile | null {
    return getLocal<UserProfile | null>(STORAGE_KEYS.USER, null);
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

  // --- SETTINGS ---
  getSettings(): Settings {
    return getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: Settings): void {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
  },

  // --- PROVIDERS ---
  getProviders(): Provider[] {
    return getLocal(STORAGE_KEYS.PROVIDERS, INITIAL_PROVIDERS);
  },
  addProvider(prov: Provider): void {
    const current = this.getProviders();
    setLocal(STORAGE_KEYS.PROVIDERS, [prov, ...current]);
  },

  // --- CATEGORIES ---
  getCategories(): Category[] {
    return getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  // --- CLIENTS ---
  getClients(): Client[] {
    return getLocal(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  },
  addClient(client: Client): void {
    const current = this.getClients();
    setLocal(STORAGE_KEYS.CLIENTS, [client, ...current]);
  },

  // --- CANONICAL PRODUCTS & FUZZY SEARCH ---
  getProducts(): CanonicalProduct[] {
    return getLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  getProductById(id: string): CanonicalProduct | undefined {
    return this.getProducts().find(p => p.id === id);
  },

  /**
   * Búsqueda difusa en catálogo maestro y alias usando similitud trigram
   */
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

      for (const alias of p.aliases) {
        const aScore = matchScore(cleanQ, alias);
        if (aScore > maxScore) {
          maxScore = aScore;
          bestAlias = alias;
        }
      }

      // Si la consulta está directamente contenida en el SKU o código
      if (normalizeText(p.sku).includes(cleanQ)) {
        maxScore = Math.max(maxScore, 0.95);
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

  /**
   * Encuentra las mejores sugerencias para homologar un texto de factura desconocido
   */
  suggestForRawText(rawText: string): { product: CanonicalProduct; confidence: number }[] {
    const matches = this.searchProducts(rawText, 3);
    return matches.map(m => ({
      product: m.product,
      confidence: m.score,
    }));
  },

  /**
   * Asocia un alias nuevo a un producto canónico y lo persiste (Homologación confirmada)
   */
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

  /**
   * Registra un nuevo precio en el historial de un producto y actualiza sus estadísticas
   */
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

      // Recalcular min y max
      const prices = p.history.map(h => h.price_pyg);
      p.min_price_pyg = Math.min(...prices);
      p.max_price_pyg = Math.max(...prices);

      products[idx] = p;
      setLocal(STORAGE_KEYS.PRODUCTS, products);
    }
  },

  /**
   * Crea un nuevo producto canónico desde la interfaz
   */
  createProduct(product: CanonicalProduct): void {
    const current = this.getProducts();
    setLocal(STORAGE_KEYS.PRODUCTS, [product, ...current]);
  },

  // --- INVOICES / FACTURAS ---
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

  /**
   * Aprueba un ítem de factura: guarda el alias si es nuevo y agrega el precio al historial
   */
  approveInvoiceItem(invoiceId: string, itemId: string, canonicalProductId: string): void {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return;

    const item = invoice.items.find(it => it.id === itemId);
    if (!item) return;

    // 1. Guardar alias
    this.addAliasToProduct(canonicalProductId, item.raw_description);

    // 2. Registrar en historial de precios
    this.recordPrice(canonicalProductId, {
      canonical_product_id: canonicalProductId,
      provider_id: invoice.provider_id,
      provider_name: invoice.provider_name,
      price_pyg: item.unit_cost_pyg,
      date: invoice.issue_date,
      source_type: 'invoice_photo',
      source_ref: `Factura ${invoice.invoice_number}`,
      notes: `Aprobado desde revisión de factura ${invoice.invoice_number}`,
    });

    // 3. Marcar ítem como confirmado en la factura
    item.is_confirmed = true;
    item.suggested_canonical_id = canonicalProductId;
    this.saveInvoice(invoice);
  },

  // --- BUDGETS / PRESUPUESTOS ---
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
      current[idx] = budget;
    } else {
      current.unshift(budget);
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

    const count = this.getBudgets().length + 1;
    const duplicated: Budget = {
      ...original,
      id: `b-${Date.now()}`,
      budget_number: `COT-2026-${String(count).padStart(3, '0')}`,
      title: `${original.title} (Copia)`,
      status: 'draft',
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

  // --- BACKUP & RESTORE (ANTI-PÉRDIDAS) ---
  exportBackupJSON(): string {
    const backupData = {
      app: 'ElectroCotiza',
      version: '1.0',
      exported_at: new Date().toISOString(),
      user: this.getCurrentUser(),
      settings: this.getSettings(),
      products: this.getProducts(),
      budgets: this.getBudgets(),
      clients: this.getClients(),
      providers: this.getProviders(),
      categories: this.getCategories(),
      invoices: this.getInvoices(),
    };
    return JSON.stringify(backupData, null, 2);
  },

  importBackupJSON(jsonString: string): { success: boolean; message: string; countBudgets?: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        throw new Error('Formato de archivo inválido.');
      }
      if (data.settings) setLocal(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.products && Array.isArray(data.products)) setLocal(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.budgets && Array.isArray(data.budgets)) setLocal(STORAGE_KEYS.BUDGETS, data.budgets);
      if (data.clients && Array.isArray(data.clients)) setLocal(STORAGE_KEYS.CLIENTS, data.clients);
      if (data.providers && Array.isArray(data.providers)) setLocal(STORAGE_KEYS.PROVIDERS, data.providers);
      if (data.categories && Array.isArray(data.categories)) setLocal(STORAGE_KEYS.CATEGORIES, data.categories);
      if (data.invoices && Array.isArray(data.invoices)) setLocal(STORAGE_KEYS.INVOICES, data.invoices);
      if (data.user) setLocal(STORAGE_KEYS.USER, data.user);

      return {
        success: true,
        message: 'Copia de seguridad restaurada con éxito.',
        countBudgets: data.budgets?.length || 0,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al restaurar: ${err.message || 'Archivo dañado o no compatible.'}`,
      };
    }
  },

  // --- RESET TO FACTORY / SEED ---
  resetToInitialData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.PROVIDERS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },
};

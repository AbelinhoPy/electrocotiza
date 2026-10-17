export type Role = 'owner' | 'admin' | 'electrician' | 'assistant';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone: string;
  organization_id: string;
  avatar_url?: string;
}

export interface Organization {
  id: string;
  name: string;
  fantasy_name?: string;
  ruc: string;
  phone: string;
  email: string;
  city: string;
  department: string;
  address: string;
  logo_url: string;
  // Cuentas bancarias para presupuestos
  bank_name?: string;
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  bank_sipap_alias?: string;
}

export interface Provider {
  id: string;
  name: string;
  fantasy_name?: string;
  ruc: string;
  city: string;
  address: string;
  phone: string;
  website?: string;
  email?: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ProductAlias {
  id: string;
  canonical_product_id: string;
  alias: string;
  normalized_alias: string;
  is_confirmed: boolean;
  similarity_score: number;
}

export interface PriceRecord {
  id: string;
  canonical_product_id: string;
  provider_id: string;
  provider_name: string;
  price_pyg: number;
  date: string; // ISO date 'YYYY-MM-DD'
  source_type: 'invoice_photo' | 'invoice_pdf' | 'pdf_pricelist' | 'web_crawl' | 'manual';
  source_ref?: string;
  notes?: string;
}

export interface CanonicalProduct {
  id: string;
  category_id: string;
  category_name?: string;
  sku: string;
  name: string;
  normalized_name: string;
  brand: string;
  unit: string; // 'm', 'un', 'rollo', 'barra', 'caja', 'kg'
  image_url?: string;
  base_description: string;
  min_price_pyg: number;
  max_price_pyg: number;
  last_price_pyg: number;
  last_price_date: string;
  last_provider_name?: string;
  aliases: string[];
  history: PriceRecord[];
}

export interface Client {
  id: string;
  name: string;
  ruc_or_ci: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes?: string;
}

export interface BudgetItem {
  id: string;
  canonical_product_id?: string;
  provider_id?: string;
  provider_name?: string;
  item_type: 'material' | 'labor' | 'service';
  description: string;
  quantity: number;
  unit: string;
  unit_cost_pyg: number;
  margin_pct: number;
  unit_sale_pyg: number;
  total_sale_pyg: number;
  position: number;
  image_url?: string;
  notes?: string;
}

export interface Budget {
  id: string;
  budget_number: string;
  title: string;
  client: Client;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  global_margin_pct: number;
  total_cost_pyg: number;
  total_sale_pyg: number;
  iva_amount_pyg: number; // 10% IVA
  validity_days: number;
  delivery_terms: string;
  payment_terms: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: BudgetItem[];
}

export interface ExtractedInvoiceItem {
  id: string;
  raw_description: string;
  quantity: number;
  unit: string;
  unit_cost_pyg: number;
  iva_rate: number;
  total_pyg: number;
  suggested_canonical_id?: string;
  suggested_canonical_name?: string;
  match_confidence?: number;
  is_confirmed: boolean;
}

export interface IngestedInvoice {
  id: string;
  provider_id: string;
  provider_name: string;
  invoice_number: string;
  timbrado: string;
  ruc: string;
  issue_date: string;
  payment_condition: 'contado' | 'credito';
  subtotal_pyg: number;
  iva_10_pyg: number;
  total_pyg: number;
  file_url: string;
  file_name: string;
  status: 'pending_review' | 'approved' | 'rejected';
  items: ExtractedInvoiceItem[];
  created_at: string;
}

export interface Settings {
  company_name: string;
  fantasy_name: string;
  ruc: string;
  phone: string;
  email: string;
  city: string;
  department: string;
  address: string;
  logo_url: string;
  // Cuentas Bancarias
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_account_type: string;
  bank_sipap_alias: string;
  // Parámetros de Exportación
  pdf_gold_border: boolean;
  pdf_validez_dias: number;
  pdf_condicion_pago_defecto: string;
  pdf_plazo_entrega_defecto: string;
  pdf_pie_texto: string;
  default_margin_pct: number;
  price_stale_days: number;
  iva_rate_pct: number;
}

/**
 * Sistema de Gestión Comercial y Técnica Industrial para Instalaciones Eléctricas (Paraguay)
 * Definiciones de Tipos de Dominio y Modelos del Sistema
 */

// --- 1. ROLES Y USUARIOS ---
export type Role = 'admin' | 'secretaria' | 'presupuestista' | 'vendedor' | 'tecnico' | 'consulta' | 'owner' | 'electrician' | 'assistant';

export interface UserPermissions {
  canViewCosts: boolean;
  canEditBudgets: boolean;
  canApproveDiscounts: boolean;
  canManageProjects: boolean;
  canManageInventory: boolean;
  canManageClients: boolean;
  canManageUsers: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone: string;
  organization_id: string;
  avatar_url?: string;
  discount_limit_pct?: number; // Límite de descuento sin requerir aprobación (defecto: 20%)
}

// --- 2. EMPRESA Y CONFIGURACIÓN ---
export interface CompanySettings {
  id?: string;
  company_name: string;
  fantasy_name: string;
  ruc: string;
  phone: string;
  email: string;
  city: string;
  department: string;
  address: string;
  logo_url: string;
  // Parámetros comerciales y de cálculo
  default_margin_pct: number; // Defecto: 30%
  pricing_method: 'margin' | 'markup'; // 'margin' = sobre venta (defecto), 'markup' = sobre costo
  max_unapproved_discount_pct: number; // Defecto: 20%
  default_currency: 'PYG' | 'USD';
  exchange_rate_usd_pyg: number; // Cotización Gs por USD (ej: 7950)
  default_iva_rate_pct: number; // Defecto: 10%
  iva_rate_pct?: number; // Compatibilidad
  price_stale_days: number; // Defecto: 60 días
  // Parámetros de PDF
  pdf_gold_border: boolean;
  pdf_validez_dias: number;
  pdf_condicion_pago_defecto: string;
  pdf_plazo_entrega_defecto: string;
  pdf_pie_texto: string;
  // Cuentas Bancarias SIPAP
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_account_type: string;
  bank_sipap_alias: string;
}

// Compatibilidad con Settings anterior
export type Settings = CompanySettings;

// --- 3. CLIENTES Y PROVEEDORES ---
export interface Client {
  id: string;
  name: string; // Nombre comercial
  business_name?: string; // Razón social
  ruc_or_ci: string;
  contact_person?: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Provider {
  id: string;
  name: string;
  fantasy_name?: string;
  ruc: string;
  city: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  default_currency?: 'PYG' | 'USD';
  notes?: string;
  is_active?: boolean;
  last_updated?: string;
}

// --- 4. CATÁLOGO DE MATERIALES Y SERVICIOS ---
export type UnitOfMeasure = 'UND' | 'M' | 'KM' | 'M²' | 'M³' | 'KG' | 'L' | 'JUEGO' | 'HORA' | 'DÍA' | 'un' | 'm' | 'rollo' | 'barra' | 'caja' | string;

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
  provider_id?: string;
}

export interface PriceRecord {
  id: string;
  canonical_product_id: string;
  provider_id: string;
  provider_name: string;
  provider_product_code?: string;
  origin_description?: string;
  currency?: 'PYG' | 'USD';
  price_pyg: number;
  includes_iva?: boolean;
  iva_rate_pct?: number;
  date: string; // 'YYYY-MM-DD'
  valid_until?: string;
  source_type: 'invoice_photo' | 'invoice_pdf' | 'pdf_pricelist' | 'web_crawl' | 'manual' | 'xml_import';
  source_ref?: string;
  created_by_user?: string;
  notes?: string;
}

export interface CanonicalProduct {
  id: string;
  internal_code?: string; // SKU
  sku: string; // Compatibilidad
  name: string; // Descripción genérica
  normalized_name?: string; // Búsqueda y concordancia difusa
  technical_description?: string; // Descripción técnica de ingeniería
  category_id: string;
  category_name?: string;
  brand: string;
  model?: string;
  unit: UnitOfMeasure;
  is_active?: boolean;
  image_url?: string;
  base_description: string;
  technical_doc_url?: string;
  min_price_pyg: number;
  max_price_pyg: number;
  last_price_pyg: number;
  last_price_date: string;
  last_provider_name?: string;
  aliases: string[];
  history: PriceRecord[];
}

export interface CatalogService {
  id: string;
  code: string;
  description: string;
  billing_unit: 'HORA' | 'DÍA' | 'BOCA' | 'GLOBAL' | 'M' | 'UND';
  rate_pyg: number;
  estimated_hours?: number;
  category: string;
  is_active: boolean;
}

// --- 5. PRESUPUESTOS Y ESTRUCTURA JERÁRQUICA ---
export type QuoteStatus = 
  | 'draft'                  // Borrador
  | 'pending_authorization'  // Pendiente de autorización (descuento > 20% o margen bajo)
  | 'sent'                   // Enviado al cliente
  | 'accepted'               // Aprobado por el cliente
  | 'rejected'               // Rechazado
  | 'expired'                // Vencido
  | 'cancelled';             // Anulado

export interface EquipmentItem {
  id: string;
  name: string; // ej. Bomba de Presurización 15HP, Compresor 2, Tablero Principal
  quantity: number;
  location: string; // ej. Sala de Bombas, Planta Baja
  technical_specs?: string; // ej. 380V Trifásico, Arrancador Suave, 22A nominal
  subgroup_id?: string; // Relación con subgrupo de materiales
  notes?: string;
}

export interface QuotePriceSnapshot {
  unit_cost_pyg: number;
  currency: 'PYG' | 'USD';
  exchange_rate: number;
  provider_id?: string;
  provider_name?: string;
  origin_description?: string;
  price_date: string;
  pricing_method: 'margin' | 'markup';
  margin_pct: number;
  sale_price_before_discount: number;
  discount_pct: number;
  final_unit_price: number;
  iva_rate_pct: number;
  is_excluded_or_client_provided?: boolean;
}

export interface BudgetItem {
  id: string;
  subgroup_id?: string;
  hierarchical_number?: string; // ej. 1.1, 1.2, 2.1
  canonical_product_id?: string;
  provider_id?: string;
  provider_name?: string;
  item_type: 'material' | 'labor' | 'service';
  description: string;
  brand?: string;
  model?: string;
  quantity: number;
  unit: string;
  unit_estimated_time_hours?: number; // Tiempo técnico unitario
  total_estimated_time_hours?: number; // cantidad * tiempo unitario
  unit_cost_pyg: number;
  margin_pct: number;
  discount_pct?: number;
  unit_sale_pyg: number;
  total_sale_pyg: number;
  position: number;
  image_url?: string;
  notes?: string;
  snapshot?: QuotePriceSnapshot;
  is_excluded_or_client_provided?: boolean;
}

export interface QuoteGroup {
  id: string;
  name: string; // ej: 'Tablero General', 'CCM', 'Canalizaciones', 'Alimentadores', 'Iluminación'
  alias?: string;
  order: number;
  notes?: string;
  is_collapsed?: boolean;
  items: BudgetItem[];
}

export interface LaborLine {
  id: string;
  method: 'man_hours' | 'service'; // Horas hombre vs Servicio catálogo
  technician_category?: string; // ej: 'Oficial Electricista', 'Técnico Especialista Automatización', 'Ayudante'
  hourly_rate_pyg?: number;
  hours_per_worker?: number;
  worker_count?: number;
  catalog_service_id?: string;
  service_description: string;
  billing_unit?: string;
  service_rate_pyg?: number;
  quantity?: number;
  total_pyg: number;
  is_included_in_quote: boolean;
  covered_by_other_concept?: boolean; // Prevención de duplicación de cobro
  equivalent_concept_note?: string;
}

export interface LogisticsLine {
  id: string;
  concept_type: 'km_mobility' | 'daily_per_diem' | 'daily_lodging' | 'freight' | 'equipment_rental' | 'fixed_transfer' | 'other';
  description: string;
  calculation_type: 'per_km' | 'per_person_day' | 'per_person_night' | 'fixed_or_qty';
  quantity: number; // km, fletes, etc.
  unit: string;
  people_count?: number;
  days_or_nights?: number;
  unit_rate_pyg: number;
  cost_pyg: number;
  margin_pct: number;
  sale_price_pyg: number;
  is_included_in_quote: boolean;
}

export interface ScheduleTask {
  id: string;
  subgroup_id?: string;
  title: string;
  assigned_to: string;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string;
  estimated_hours: number;
  workers_count: number;
  dependencies?: string[]; // IDs de tareas previas requeridas
  progress_pct: number; // 0 - 100
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface DiscountApprovalRequest {
  id: string;
  quote_id: string;
  requested_by_user_id: string;
  requested_by_name: string;
  discount_pct: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by_user_id?: string;
  approved_by_name?: string;
  approved_at?: string;
  economic_conditions_hash?: string; // Si cambian los montos, se invalida
}

export interface QuoteRevision {
  revision_number: number;
  created_at: string;
  created_by_name: string;
  total_sale_pyg: number;
  total_cost_pyg: number;
  subtotal_net_pyg: number;
  iva_amount_pyg: number;
  summary_notes: string;
  snapshot_data: any; // Copia inmutable completa de datos del presupuesto
}

export interface Budget {
  id: string;
  budget_number: string; // Formato PRES-AAAA-NNNN
  title: string;
  project_name?: string;
  client: Client;
  status: QuoteStatus;
  is_archived: boolean;
  version: number;
  current_revision: number;
  revisions: QuoteRevision[];
  
  // Parámetros económicos
  currency: 'PYG' | 'USD';
  exchange_rate_usd_pyg: number;
  default_iva_rate_pct: number;
  global_margin_pct: number;
  pricing_method: 'margin' | 'markup';
  
  // Totales
  total_materials_cost_pyg: number;
  total_materials_sale_pyg: number;
  total_labor_sale_pyg: number;
  total_logistics_sale_pyg: number;
  total_other_sale_pyg: number;
  total_discount_amount_pyg: number;
  subtotal_net_pyg: number;
  iva_amount_pyg: number;
  total_cost_pyg: number;
  total_sale_pyg: number;
  estimated_profit_pyg: number;
  profit_margin_pct: number;

  // Condiciones comerciales
  validity_days: number;
  delivery_terms: string;
  payment_terms: string;
  salesperson_name?: string;
  salesperson_id?: string;
  internal_notes?: string;
  notes?: string; // Notas visibles en el presupuesto
  suggested_price_strategy: 'last_price' | 'cheapest' | 'weighted_avg';

  // Colecciones del asistente de 8 pasos
  equipments: EquipmentItem[];
  subgroups: QuoteGroup[];
  items: BudgetItem[]; // Vista aplanada o ítems directos
  labor_lines: LaborLine[];
  logistics_lines: LogisticsLine[];
  schedule_tasks: ScheduleTask[];
  discount_approval?: DiscountApprovalRequest;

  created_at: string;
  updated_at: string;
}

// Alias para Quote
export type Quote = Budget;

// --- 6. PROYECTOS Y SEGUIMIENTO ---
export type ProjectStatus = 'planificacion' | 'en_ejecucion' | 'en_pruebas' | 'finalizado' | 'suspendido';

export interface ProjectMaterial {
  id: string;
  material_id: string;
  description: string;
  unit: string;
  quantity_required: number;
  quantity_received: number;
  quantity_installed: number;
  quantity_pending: number;
  notes?: string;
}

export interface ScopeChange {
  id: string;
  date: string;
  description: string;
  additional_amount_pyg: number;
  approved_by: string;
}

export interface Project {
  id: string;
  code: string; // ej. PROY-2026-0001
  name: string;
  quote_id: string;
  quote_number: string;
  client: Client;
  manager_name: string;
  status: ProjectStatus;
  start_date: string;
  estimated_end_date: string;
  actual_end_date?: string;
  progress_pct: number;
  total_contract_pyg: number;
  materials: ProjectMaterial[];
  scope_changes: ScopeChange[];
  tasks: ScheduleTask[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- 7. INVENTARIO BÁSICO ---
export interface Warehouse {
  id: string;
  name: string; // ej. 'Almacén Central Asunción', 'Taller de Montaje de Tableros', 'Pañol Obra'
  location: string;
  is_active: boolean;
}

export interface InventoryStock {
  id: string;
  material_id: string;
  warehouse_id: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number; // physical_stock - reserved_stock
  min_alert_stock: number;
}

export type InventoryMovementType = 
  | 'entrada' 
  | 'salida' 
  | 'transferencia' 
  | 'ajuste_positivo' 
  | 'ajuste_negativo' 
  | 'reserva_proyecto' 
  | 'liberacion_reserva';

export interface InventoryMovement {
  id: string;
  movement_number: string;
  movement_type: InventoryMovementType;
  material_id: string;
  material_name: string;
  source_warehouse_id?: string;
  target_warehouse_id?: string;
  quantity: number;
  unit: string;
  reason: string;
  reference_document?: string; // ej. Factura F-001, Remisión R-102, Proyecto PROY-2026-001
  project_id?: string;
  user_name: string;
  created_at: string;
}

// --- 8. ÓRDENES DE SERVICIO Y CHECKLISTS ---
export type ServiceOrderStatus = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';

export interface ServiceOrder {
  id: string;
  order_number: string; // ej. OS-2026-0001
  client_id: string;
  client_name: string;
  project_id?: string;
  project_name?: string;
  assigned_technician: string;
  date: string;
  work_description: string;
  estimated_hours: number;
  actual_hours?: number;
  materials_planned: { material_id: string; description: string; quantity: number; unit: string }[];
  materials_used: { material_id: string; description: string; quantity: number; unit: string }[];
  status: ServiceOrderStatus;
  notes?: string;
  signature_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistQuestion {
  id: string;
  prompt: string;
  response_type: 'yes_no_na' | 'text' | 'number' | 'single_choice';
  options?: string[];
  is_mandatory: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  questions: ChecklistQuestion[];
}

export interface ChecklistTemplate {
  id: string;
  title: string; // ej. 'Inspección de Tablero General de Distribución (TGD)', 'Protocolo de Acometida Eléctrica'
  category: string;
  sections: ChecklistSection[];
  is_active: boolean;
}

export interface ChecklistAnswer {
  question_id: string;
  answer_value: string; // 'SI', 'NO', 'N/A', texto o número
  notes?: string;
}

export interface ChecklistExecution {
  id: string;
  template_id: string;
  template_title: string;
  project_id?: string;
  service_order_id?: string;
  inspector_name: string;
  execution_date: string;
  answers: ChecklistAnswer[];
  general_status: 'aprobado' | 'observado' | 'rechazado';
  observations?: string;
  created_at: string;
}

// --- 9. FINANZAS Y GASTOS DE PROYECTO ---
export interface ProjectPaymentMilestone {
  id: string;
  project_id: string;
  description: string; // ej. 'Anticipo 30%', 'Entrega de Tableros 40%', 'Puesta en Marcha 30%'
  due_date: string;
  amount_pyg: number;
  paid_amount_pyg: number;
  status: 'pendiente' | 'parcial' | 'cobrado' | 'vencido';
  payment_date?: string;
  reference_receipt?: string;
}

export interface ProjectExpense {
  id: string;
  project_id: string;
  date: string;
  concept: string;
  category: 'material_adicional' | 'transporte' | 'viaticos' | 'imprevisto' | 'subcontrato';
  amount_pyg: number;
  provider_or_recipient: string;
  receipt_number?: string;
}

// --- 10. AUDITORÍA Y TRAZABILIDAD ---
export interface AuditEvent {
  id: string;
  event_type: 
    | 'quote_status_changed' 
    | 'quote_revision_emitted' 
    | 'discount_approved' 
    | 'price_updated' 
    | 'inventory_moved' 
    | 'project_created' 
    | 'xml_imported';
  entity: string;
  entity_id: string;
  user_name: string;
  user_id?: string;
  details: string;
  previous_state?: any;
  new_state?: any;
  created_at: string;
}

// --- 11. INGESTA Y COMPROBANTES DE FACTURA ---
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

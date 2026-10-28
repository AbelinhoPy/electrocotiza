-- ==============================================================================
-- ElectroCotiza - Esquema de Base de Datos PostgreSQL / Supabase
-- Sistema de Presupuestos y Homologación de Precios Eléctricos para Paraguay
-- Cliente inicial: Construlogica Emprendimientos S.A.
-- Moneda: Guaraníes (PYG) - Sin decimales (BIGINT)
-- ==============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ORGANIZACIONES Y EQUIPOS
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ruc VARCHAR(30),
    phone VARCHAR(50),
    email VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Asunción',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'electrician' CHECK (role IN ('owner', 'admin', 'electrician', 'assistant')),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CONFIGURACIÓN DEL SISTEMA
CREATE TABLE IF NOT EXISTS settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255) DEFAULT 'Construlogica Emprendimientos S.A.',
    ruc VARCHAR(30) DEFAULT '80012345-6',
    phone VARCHAR(50) DEFAULT '+595 981 123456',
    email VARCHAR(100) DEFAULT 'presupuestos@construlogica.com.py',
    address VARCHAR(255) DEFAULT 'Avda. Eusebio Ayala km 4.5, Asunción',
    logo_url TEXT DEFAULT '/assets/logo.png',
    pdf_gold_border BOOLEAN DEFAULT TRUE,
    pdf_validez_dias INT DEFAULT 15,
    pdf_condicion_pago_defecto VARCHAR(255) DEFAULT 'A convenir / Contra entrega',
    pdf_plazo_entrega_defecto VARCHAR(255) DEFAULT 'Inmediato / Según avance de obra',
    pdf_pie_texto TEXT DEFAULT 'Documento de uso confidencial emitido por Construlogica Emprendimientos S.A.',
    default_margin_pct NUMERIC(5,2) DEFAULT 30.00,
    price_stale_days INT DEFAULT 60,
    iva_rate_pct NUMERIC(5,2) DEFAULT 10.00,
    -- Datos Bancarios para Transferencias SIPAP
    bank_name VARCHAR(100) DEFAULT 'Banco Itaú Paraguay',
    bank_account_holder VARCHAR(255) DEFAULT 'Construlogica Emprendimientos S.A.',
    bank_account_number VARCHAR(100) DEFAULT '720014589',
    bank_account_type VARCHAR(50) DEFAULT 'Cuenta Corriente',
    bank_sipap_alias VARCHAR(100) DEFAULT 'construlogica.py',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PROVEEDORES (Ferreterías, Importadoras, Distribuidores)
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    fantasy_name VARCHAR(255),
    ruc VARCHAR(30),
    city VARCHAR(100) DEFAULT 'Asunción',
    address TEXT,
    phone VARCHAR(100),
    email VARCHAR(100),
    website TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CATEGORÍAS DE PRODUCTOS
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_category_slug_org UNIQUE (organization_id, slug)
);

-- 7. CATÁLOGO MAESTRO CANÓNICO (Productos Unificados)
CREATE TABLE IF NOT EXISTS canonical_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    normalized_name TEXT NOT NULL,
    brand VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'un' NOT NULL, -- 'm', 'un', 'rollo', 'barra', 'caja'
    image_url TEXT,
    base_description TEXT,
    min_price_pyg BIGINT DEFAULT 0,
    max_price_pyg BIGINT DEFAULT 0,
    last_price_pyg BIGINT DEFAULT 0,
    last_price_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ALIAS Y NOMBRES DIFUSOS DE PRODUCTOS (Homologación)
CREATE TABLE IF NOT EXISTS product_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    canonical_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL,
    is_confirmed BOOLEAN DEFAULT TRUE,
    similarity_score NUMERIC(5,4) DEFAULT 1.0000,
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_alias_per_org UNIQUE (organization_id, normalized_alias)
);

-- 9. FUENTES DE PRECIOS INGRESADAS (Listas PDF, Facturas, Tickets, Scraper)
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('pdf_pricelist', 'invoice_photo', 'invoice_pdf', 'web_crawl', 'manual')),
    file_name VARCHAR(255),
    file_url TEXT,
    raw_extracted_data JSONB,
    status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. FACTURAS / TICKETS REGISTRADOS
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100),
    timbrado VARCHAR(50),
    ruc VARCHAR(30),
    issue_date DATE NOT NULL,
    payment_condition VARCHAR(50) DEFAULT 'contado' CHECK (payment_condition IN ('contado', 'credito')),
    subtotal_pyg BIGINT NOT NULL DEFAULT 0,
    iva_10_pyg BIGINT NOT NULL DEFAULT 0,
    total_pyg BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. ITEMS EXTRAÍDOS PENDIENTES DE REVISIÓN HUMANA (Human-in-the-Loop)
CREATE TABLE IF NOT EXISTS source_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    raw_description TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'un',
    unit_cost_pyg BIGINT NOT NULL,
    iva_rate NUMERIC(5,2) DEFAULT 10.00,
    total_pyg BIGINT NOT NULL,
    suggested_canonical_id UUID REFERENCES canonical_products(id) ON DELETE SET NULL,
    confirmed_canonical_id UUID REFERENCES canonical_products(id) ON DELETE SET NULL,
    match_confidence NUMERIC(5,4),
    is_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. HISTORIAL DE PRECIOS REGISTRADOS
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    canonical_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    price_pyg BIGINT NOT NULL CHECK (price_pyg > 0),
    currency VARCHAR(10) DEFAULT 'PYG',
    date DATE NOT NULL,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    source_type VARCHAR(50) DEFAULT 'invoice_photo',
    source_url_or_file TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. CLIENTES PARA PRESUPUESTOS
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ruc_or_ci VARCHAR(30),
    phone VARCHAR(50),
    email VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Asunción',
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. PRESUPUESTOS (Budgets / Cotizaciones)
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    budget_number VARCHAR(50) NOT NULL, -- ej. "COT-2026-001"
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    global_margin_pct NUMERIC(5,2) DEFAULT 30.00,
    total_cost_pyg BIGINT DEFAULT 0,
    total_sale_pyg BIGINT DEFAULT 0,
    iva_amount_pyg BIGINT DEFAULT 0,
    validity_days INT DEFAULT 15,
    delivery_terms VARCHAR(255) DEFAULT 'Inmediato / Según avance de obra',
    payment_terms VARCHAR(255) DEFAULT 'A convenir / Contra entrega',
    suggested_price_strategy VARCHAR(50) DEFAULT 'last_price' CHECK (suggested_price_strategy IN ('last_price', 'cheapest', 'weighted_avg')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. LÍNEAS DE PRESUPUESTO (Materiales y Mano de Obra)
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    canonical_product_id UUID REFERENCES canonical_products(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    item_type VARCHAR(50) DEFAULT 'material' CHECK (item_type IN ('material', 'labor', 'service')),
    description TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'un',
    unit_cost_pyg BIGINT NOT NULL DEFAULT 0,
    margin_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    unit_sale_pyg BIGINT NOT NULL, -- Costo + Margen (IVA 10% incluido)
    total_sale_pyg BIGINT NOT NULL,
    position INT DEFAULT 0,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ÍNDICES OPTIMIZADOS PARA BÚSQUEDA DIFUSA (pg_trgm) Y CONSULTAS RÁPIDAS
-- ==============================================================================

-- Búsqueda difusa en catálogo canónico y alias
CREATE INDEX IF NOT EXISTS idx_canonical_name_trgm ON canonical_products USING gin (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_alias_trgm ON product_aliases USING gin (normalized_alias gin_trgm_ops);

-- Índices de filtrado y claves foráneas
CREATE INDEX IF NOT EXISTS idx_canonical_category ON canonical_products (category_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product_date ON price_history (canonical_product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_provider ON price_history (provider_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items (budget_id);
CREATE INDEX IF NOT EXISTS idx_sources_org_status ON sources (organization_id, status);

-- ==============================================================================
-- FUNCIONES Y TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- 1. Función para normalizar texto (sin acentos, minúsculas, espacios compactos)
CREATE OR REPLACE FUNCTION normalize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(regexp_replace(
        translate(
            input_text,
            'áàäâãéèëêíìïîóòöôõúùüûñÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑ',
            'aaaaaeeeeiiiiooooouuuunAAAAAEEEEIIIIOOOOOUUUUN'
        ),
        '\s+', ' ', 'g'
    )));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Trigger para mantener normalized_name y normalized_alias actualizados
CREATE OR REPLACE FUNCTION trg_set_normalized_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'canonical_products' THEN
        NEW.normalized_name := normalize_search_text(NEW.name);
    ELSIF TG_TABLE_NAME = 'product_aliases' THEN
        NEW.normalized_alias := normalize_search_text(NEW.alias);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_canonical_norm ON canonical_products;
CREATE TRIGGER trg_canonical_norm
    BEFORE INSERT OR UPDATE OF name ON canonical_products
    FOR EACH ROW EXECUTE FUNCTION trg_set_normalized_fields();

DROP TRIGGER IF EXISTS trg_alias_norm ON product_aliases;
CREATE TRIGGER trg_alias_norm
    BEFORE INSERT OR UPDATE OF alias ON product_aliases
    FOR EACH ROW EXECUTE FUNCTION trg_set_normalized_fields();

-- 3. Trigger para actualizar precios agregados en canonical_products al insertar price_history
CREATE OR REPLACE FUNCTION trg_update_canonical_price_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE canonical_products
    SET 
        last_price_pyg = NEW.price_pyg,
        last_price_date = NEW.date,
        min_price_pyg = (
            SELECT COALESCE(MIN(price_pyg), NEW.price_pyg) 
            FROM price_history 
            WHERE canonical_product_id = NEW.canonical_product_id
        ),
        max_price_pyg = (
            SELECT COALESCE(MAX(price_pyg), NEW.price_pyg) 
            FROM price_history 
            WHERE canonical_product_id = NEW.canonical_product_id
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.canonical_product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_price_insert ON price_history;
CREATE TRIGGER trg_after_price_insert
    AFTER INSERT ON price_history
    FOR EACH ROW EXECUTE FUNCTION trg_update_canonical_price_stats();

-- 4. Búsqueda inteligente de productos (exacta + alias + trigram difusa)
CREATE OR REPLACE FUNCTION search_materials(
    p_org_id UUID,
    p_query TEXT,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR(255),
    category_name VARCHAR(150),
    brand VARCHAR(100),
    unit VARCHAR(50),
    last_price_pyg BIGINT,
    last_price_date DATE,
    min_price_pyg BIGINT,
    max_price_pyg BIGINT,
    match_score NUMERIC
) AS $$
DECLARE
    v_clean_query TEXT := normalize_search_text(p_query);
BEGIN
    RETURN QUERY
    WITH matches AS (
        -- Coincidencia directa por nombre canónico
        SELECT 
            cp.id AS p_id,
            similarity(cp.normalized_name, v_clean_query) AS score
        FROM canonical_products cp
        WHERE cp.organization_id = p_org_id
          AND (cp.normalized_name % v_clean_query OR cp.normalized_name ILIKE '%' || v_clean_query || '%')

        UNION

        -- Coincidencia por alias homologado
        SELECT 
            pa.canonical_product_id AS p_id,
            similarity(pa.normalized_alias, v_clean_query) AS score
        FROM product_aliases pa
        WHERE pa.organization_id = p_org_id
          AND (pa.normalized_alias % v_clean_query OR pa.normalized_alias ILIKE '%' || v_clean_query || '%')
    ),
    best_matches AS (
        SELECT p_id, MAX(score) AS max_score
        FROM matches
        GROUP BY p_id
    )
    SELECT 
        cp.id,
        cp.name,
        COALESCE(c.name, 'Sin categoría'),
        cp.brand,
        cp.unit,
        cp.last_price_pyg,
        cp.last_price_date,
        cp.min_price_pyg,
        cp.max_price_pyg,
        ROUND(bm.max_score::numeric, 4) AS match_score
    FROM best_matches bm
    JOIN canonical_products cp ON cp.id = bm.p_id
    LEFT JOIN categories c ON c.id = cp.category_id
    ORDER BY bm.max_score DESC, cp.name ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Sugerencia para homologar un texto nuevo de ticket/factura
CREATE OR REPLACE FUNCTION suggest_canonical_for_text(
    p_org_id UUID,
    p_raw_text TEXT
)
RETURNS TABLE (
    canonical_id UUID,
    canonical_name VARCHAR(255),
    unit VARCHAR(50),
    last_price_pyg BIGINT,
    confidence_score NUMERIC
) AS $$
DECLARE
    v_clean TEXT := normalize_search_text(p_raw_text);
BEGIN
    -- 1. Intentar coincidencia exacta con alias confirmado
    RETURN QUERY
    SELECT 
        cp.id,
        cp.name,
        cp.unit,
        cp.last_price_pyg,
        1.0000::NUMERIC AS confidence_score
    FROM product_aliases pa
    JOIN canonical_products cp ON cp.id = pa.canonical_product_id
    WHERE pa.organization_id = p_org_id 
      AND pa.normalized_alias = v_clean
    LIMIT 1;

    -- Si hubo coincidencia exacta, ya retornó. Si no, retornar las 3 sugerencias más probables por trigramas
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            cp.id,
            cp.name,
            cp.unit,
            cp.last_price_pyg,
            ROUND(GREATEST(
                similarity(cp.normalized_name, v_clean),
                COALESCE(MAX(similarity(pa.normalized_alias, v_clean)), 0)
            )::numeric, 4) AS confidence_score
        FROM canonical_products cp
        LEFT JOIN product_aliases pa ON pa.canonical_product_id = cp.id
        WHERE cp.organization_id = p_org_id
        GROUP BY cp.id, cp.name, cp.unit, cp.last_price_pyg, cp.normalized_name
        ORDER BY confidence_score DESC
        LIMIT 3;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 16. SERVICIOS Y TARIFARIO TÉCNICO (Mano de Obra y Montajes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS catalog_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    billing_unit VARCHAR(50) NOT NULL CHECK (billing_unit IN ('HORA', 'DÍA', 'BOCA', 'GLOBAL', 'M', 'UND')),
    rate_pyg BIGINT NOT NULL CHECK (rate_pyg >= 0),
    estimated_hours NUMERIC(8,2),
    category VARCHAR(100) DEFAULT 'General',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 17. PROYECTOS DE INSTALACIÓN Y MONTAJE INDUSTRIAL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE, -- ej. PROY-2026-0001
    name VARCHAR(255) NOT NULL,
    quote_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    quote_number VARCHAR(50),
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    manager_name VARCHAR(150),
    status VARCHAR(50) DEFAULT 'planificacion' CHECK (status IN ('planificacion', 'en_ejecucion', 'en_pruebas', 'finalizado', 'suspendido')),
    start_date DATE NOT NULL,
    estimated_end_date DATE NOT NULL,
    actual_end_date DATE,
    progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    total_contract_pyg BIGINT NOT NULL DEFAULT 0,
    scope_changes JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. MATERIALES DE PROYECTO (Seguimiento Requerido/Recibido/Instalado)
CREATE TABLE IF NOT EXISTS project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    material_id UUID REFERENCES canonical_products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    unit VARCHAR(50) DEFAULT 'un',
    quantity_required NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity_received NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity_installed NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity_pending NUMERIC(12,2) GENERATED ALWAYS AS (quantity_required - quantity_received) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 19. ALMACENES Y GESTIÓN MULTI-DEPÓSITO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. STOCK POR PRODUCTO Y ALMACÉN
CREATE TABLE IF NOT EXISTS inventory_stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    physical_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
    reserved_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
    available_stock NUMERIC(12,2) GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED,
    min_alert_stock NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_stock_material_warehouse UNIQUE (material_id, warehouse_id)
);

-- 21. MOVIMIENTOS KÁRDEX DE INVENTARIO
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    movement_number VARCHAR(50) NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'transferencia', 'ajuste_positivo', 'ajuste_negativo', 'reserva_proyecto', 'liberacion_reserva')),
    material_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE RESTRICT,
    material_name VARCHAR(255) NOT NULL,
    source_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    target_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) DEFAULT 'un',
    reason TEXT NOT NULL,
    reference_document VARCHAR(100),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 22. ÓRDENES DE SERVICIO TÉCNICO (OS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE, -- ej. OS-2026-0001
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    client_name VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(255),
    assigned_technician VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    work_description TEXT NOT NULL,
    estimated_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
    actual_hours NUMERIC(6,2),
    materials_planned JSONB DEFAULT '[]'::jsonb,
    materials_used JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
    notes TEXT,
    signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 23. PROTOCOLOS Y CHECKLISTS NORMATIVOS ANDE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS checklist_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE RESTRICT,
    template_title VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
    inspector_name VARCHAR(150) NOT NULL,
    execution_date DATE NOT NULL,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    general_status VARCHAR(50) DEFAULT 'aprobado' CHECK (general_status IN ('aprobado', 'observado', 'rechazado')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 24. FINANZAS: HITOS DE COBRO Y GASTOS DE PROYECTO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS project_payment_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL, -- ej. 'Anticipo 30%', 'Entrega 40%', 'Comisionamiento 30%'
    due_date DATE NOT NULL,
    amount_pyg BIGINT NOT NULL CHECK (amount_pyg >= 0),
    paid_amount_pyg BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'parcial', 'cobrado', 'vencido')),
    payment_date DATE,
    reference_receipt VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    concept TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('material_adicional', 'transporte', 'viaticos', 'imprevisto', 'subcontrato')),
    amount_pyg BIGINT NOT NULL CHECK (amount_pyg >= 0),
    provider_or_recipient VARCHAR(255) NOT NULL,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 25. AUDITORÍA INMUTABLE DE EVENTOS CRÍTICOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    details TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

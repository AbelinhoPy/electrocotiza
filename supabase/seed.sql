-- ==============================================================================
-- ElectroCotiza - Datos Iniciales de Prueba (Seed Data Real)
-- Basado en Facturas Reales de Paraguay (Ciudad del Este y Asunción)
-- Cliente: Construlogica Emprendimientos S.A.
-- ==============================================================================

-- 1. Organización Real: Construlogica Emprendimientos S.A.
INSERT INTO organizations (id, name, ruc, phone, email, city, logo_url)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Construlogica Emprendimientos S.A.',
    '80074798-4',
    '+595 983 530890',
    'construlogicaemprendimientossa@gmail.com',
    'Minga Guazú / Ciudad del Este',
    '/assets/logo.png'
) ON CONFLICT (id) DO UPDATE SET
    ruc = EXCLUDED.ruc,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;

-- Configuración de la empresa
INSERT INTO settings (
    organization_id, company_name, ruc, phone, email, address, logo_url,
    pdf_gold_border, pdf_validez_dias, default_margin_pct, price_stale_days,
    bank_name, bank_account_holder, bank_account_number, bank_account_type, bank_sipap_alias
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Construlogica Emprendimientos S.A.',
    '80074798-4',
    '+595 983 530890',
    'construlogicaemprendimientossa@gmail.com',
    'Km 16 Avda. Juana María de Lara 0 - Minga Guazú, Alto Paraná',
    '/assets/logo.png',
    TRUE,
    15,
    30.00,
    60,
    'Banco Itaú Paraguay',
    'Construlogica Emprendimientos S.A.',
    '720014589',
    'Cuenta Corriente',
    'construlogica.py'
) ON CONFLICT (organization_id) DO UPDATE SET
    ruc = EXCLUDED.ruc,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    bank_name = EXCLUDED.bank_name,
    bank_account_holder = EXCLUDED.bank_account_holder,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_sipap_alias = EXCLUDED.bank_sipap_alias;

-- 2. Perfil de Usuario Administrador / Electricista Jefe
INSERT INTO profiles (id, organization_id, email, full_name, role, phone)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'construlogicaemprendimientossa@gmail.com',
    'Ing. Abel K. (Jefe de Obra)',
    'owner',
    '+595 983 530890'
) ON CONFLICT (id) DO NOTHING;

-- 3. Proveedores Clave de Paraguay (Incluyendo los proveedores reales de las facturas)
INSERT INTO providers (id, organization_id, name, fantasy_name, ruc, city, address, phone, website) VALUES
(
    'c0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    'ENERLUZ S.A.',
    'Enerluz',
    '80057523-7',
    'Ciudad del Este',
    'Km 4, Camino a Hernandarias, Alto Paraná',
    '061 576462',
    'https://www.enerluz.com.py'
),
(
    'c0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'FIXOPAR S.A.',
    'Fixopar Elementos de Fijación',
    '80066137-0',
    'Ciudad del Este',
    'Avda. Cnel. José Sánchez y R.I. 3 Corrales, Pablo Rojas',
    '+595 61 572 790',
    'https://www.fixopar.com.py'
),
(
    'c0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    'ELECTRO SYSTEM S.A.',
    'Electro System',
    '80083458-5',
    'Ciudad del Este',
    'Avda. Tte. Rojas Silva Nº 102 c/ Patricio Colman',
    '+595 981 011 088',
    'https://www.electrosystem.com.py'
),
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Luminotecnia S.A.',
    'Luminotecnia',
    '80001234-1',
    'Asunción',
    'Av. Artigas c/ General Santos',
    '+595 21 214-000',
    'https://www.luminotecnia.com.py'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Record Electric S.A.E.C.A.',
    'Record Electric',
    '80005678-2',
    'Asunción',
    'Av. Boggiani c/ Rca. Argentina',
    '+595 21 518-5000',
    'https://www.recordelectric.com'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Condel Distribuidora de Conductores',
    'Condel Py',
    '80011223-3',
    'San Lorenzo',
    'Ruta Mcal. Estigarribia Km 9.5',
    '+595 21 588-900',
    'https://www.condel.com.py'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Ferretería La Central',
    'La Central',
    '80033445-5',
    'Fernando de la Mora',
    'Av. Fernando de la Mora c/ Zavala Cué',
    '+595 21 500-111',
    NULL
) ON CONFLICT DO NOTHING;

-- 4. Categorías Principales
INSERT INTO categories (id, organization_id, name, slug, sort_order) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cables y Conductores', 'cables-conductores', 1),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Tableros y Protecciones', 'tableros-protecciones', 2),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Barras y Conectores de Cobre', 'barras-cobre', 3),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Canalizaciones y Cajas', 'canalizaciones-cajas', 4),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Tomas, Llaves e Interruptores', 'tomas-llaves', 5),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Fijaciones, Bulonería y Tornillos', 'fijaciones-bulones', 6),
('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Iluminación y Plafones', 'iluminacion-plafones', 7),
('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Mano de Obra e Instalación', 'mano-de-obra', 8)
ON CONFLICT DO NOTHING;

-- 5. Catálogo Maestro Canónico (Incluyendo los ítems de las facturas)
INSERT INTO canonical_products (id, organization_id, category_id, sku, name, normalized_name, brand, unit, base_description) VALUES
-- Barras de cobre de facturas ENERLUZ
(
    'e0000000-0000-0000-0000-000000000020',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'BARRA-CU-20X3',
    'Barra de Cobre Electrolítico 20x3mm 3/4" x 1/8" (211A)',
    'barra de cobre electrolitico 20x3mm 3/4 x 1/8 211a',
    'Enerluz / Nacional',
    'barra',
    'Barra plana de cobre electrolítico de alta conductividad para distribución y conexión en tableros generales.'
),
(
    'e0000000-0000-0000-0000-000000000021',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'BARRA-CU-30X5',
    'Barra de Cobre Electrolítico 30x5mm 1.1/4" x 3/16" (361A)',
    'barra de cobre electrolitico 30x5mm 1.1/4 x 3/16 361a',
    'Enerluz / Nacional',
    'barra',
    'Barra de cobre para tableros de transferencia y celdas de potencia.'
),
(
    'e0000000-0000-0000-0000-000000000022',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'BARRA-CU-30X10',
    'Barra de Cobre Electrolítico 30x10mm 1.1/4" x 3/8" (645A)',
    'barra de cobre electrolitico 30x10mm 1.1/4 x 3/8 645a',
    'Enerluz / Nacional',
    'barra',
    'Barra pesada de cobre para acometidas y barras principales de alta corriente.'
),
(
    'e0000000-0000-0000-0000-000000000023',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'BARRA-CU-50X10',
    'Barra de Cobre Electrolítico 50x10mm 2" x 3/8" (1032A)',
    'barra de cobre electrolitico 50x10mm 2 x 3/8 1032a',
    'Enerluz / Nacional',
    'barra',
    'Barra de cobre de alta capacidad para transformadores y barras colectoras de hasta 1000A.'
),
(
    'e0000000-0000-0000-0000-000000000024',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000004',
    'CANAL-PVC-40X50',
    'Cablecanal Ranurado PVC 40x50mm Gris con Tapa',
    'cablecanal ranurado pvc 40x50mm gris con tapa',
    'Enerluz / Dutoplast',
    'un',
    'Canaleta ranurada para organización de conductores en tableros eléctricos.'
),
-- Disyuntores ABB de la nota de pedido
(
    'e0000000-0000-0000-0000-000000000025',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'DISY-ABB-3P-20A',
    'Disyuntor Termomagnético Tripolar 3P 20A 6kA Curva C SH203-ABB',
    'disyuntor termomagnetico tripolar 3p 20a 6ka curva c sh203-abb',
    'ABB',
    'un',
    'Interruptor termomagnético trifásico riel DIN, 6kA de poder de ruptura.'
),
(
    'e0000000-0000-0000-0000-000000000026',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'DISY-ABB-3P-25A',
    'Disyuntor Termomagnético Tripolar 3P 25A 6kA Curva C SH203-ABB',
    'disyuntor termomagnetico tripolar 3p 25a 6ka curva c sh203-abb',
    'ABB',
    'un',
    'Interruptor termomagnético trifásico riel DIN 25A, 6kA.'
),
-- Bulonería y fijación de FIXOPAR
(
    'e0000000-0000-0000-0000-000000000027',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000006',
    'BULON-M10X25',
    'Bulón Cabeza Hexagonal Acero 8.8 M10 x 25mm Rosca Entera Zincado',
    'bulon cabeza hexagonal acero 8.8 m10 x 25mm rosca entera zincado',
    'Fixopar',
    'un',
    'Tornillo de alta resistencia clase 8.8 para fijación mecánica y unión de barras.'
),
(
    'e0000000-0000-0000-0000-000000000028',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000006',
    'TUERCA-HEX-M10',
    'Tuerca Hexagonal Clase 8 M10 x 1.50 Paso Grueso Zincada',
    'tuerca hexagonal clase 8 m10 x 1.50 paso grueso zincada',
    'Fixopar',
    'un',
    'Tuerca para fijación de tableros y perfilería con bulón M10.'
),
(
    'e0000000-0000-0000-0000-000000000029',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000006',
    'ARANDELA-LISA-M10',
    'Arandela Plana Lisa DIN 125 M10 Zincada (10.5 x 20.0 x 2.0)',
    'arandela plana lisa din 125 m10 zincada 10.5 x 20.0 x 2.0',
    'Fixopar',
    'un',
    'Arandela metálica para distribución de apriete en bornes y barras.'
),
-- Cables y luminarias estándar
(
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'CAB-UNI-2.5',
    'Cable Unipolar de Cobre 2.5 mm² 750V',
    'cable unipolar de cobre 2.5 mm2 750v',
    'Condel / Indelpa',
    'm',
    'Conductor de cobre electrolítico flexible, aislación PVC antillama 70°C.'
),
(
    'e0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'DIF-BIP-25A-30MA',
    'Interruptor Diferencial Bipolar 2x25A 30mA (Disyuntor Salvavita)',
    'interruptor diferencial bipolar 2x25a 30ma disyuntor salvavita',
    'Schneider Electric',
    'un',
    'Protección contra fugas a tierra e electrocución para personas.'
),
(
    'e0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000007',
    'PLAFON-LED-18W-EMB',
    'Panel Plafón LED 18W Redondo Embutir Luz Cálida/Fría',
    'panel plafon led 18w redondo embutir luz calida fria',
    'Lumi / Macroled',
    'un',
    'Luminaria de bajo consumo con driver incluido para cielo raso.'
) ON CONFLICT DO NOTHING;

-- 6. Alias de Homologación Extraídos Directamente de las Facturas
INSERT INTO product_aliases (organization_id, canonical_product_id, alias, normalized_alias, is_confirmed, similarity_score) VALUES
-- De factura ENERLUZ 0033088
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000020', 'BARRAM. COBRE 20X3MM 3/4X1/8 (211A)', 'barram. cobre 20x3mm 3/4x1/8 211a', TRUE, 1.0),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000020', 'Barra Cobre 20x3 Enerluz', 'barra cobre 20x3 enerluz', TRUE, 0.95),

-- De factura ENERLUZ 0032949
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000021', 'BARRAM. COBRE 30X5MM 1.1/4X3/16 (361A)', 'barram. cobre 30x5mm 1.1/4x3/16 361a', TRUE, 1.0),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000023', 'BARRAM. COBRE 50X10MM 2X3/8 (1032A)', 'barram. cobre 50x10mm 2x3/8 1032a', TRUE, 1.0),

-- De factura ENERLUZ 0033018
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000022', 'BARRAM. COBRE 30X10MM 1.1/4X 3/8 (645A)', 'barram. cobre 30x10mm 1.1/4x 3/8 645a', TRUE, 1.0),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000024', 'CABLECANAL PVC RA 40X50MM - GRIS', 'cablecanal pvc ra 40x50mm - gris', TRUE, 1.0),

-- De nota de pedido ABB
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000025', 'A2 DISY TERM DIN 3P 020A 6KA SH203-ABB', 'a2 disy term din 3p 020a 6ka sh203-abb', TRUE, 1.0),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000026', 'A2 DISY TERM DIN 3P 025A 6KA SH203-ABB', 'a2 disy term din 3p 025a 6ka sh203-abb', TRUE, 1.0),

-- De factura FIXOPAR 0040993
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000027', 'BULON SX MA 8.8 BC 10 X 25 RI', 'bulon sx ma 8.8 bc 10 x 25 ri', TRUE, 1.0),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000028', 'TUERCA HEX CL8 MA M10 X 1.50 X 17 - BC', 'tuerca hex cl8 ma m10 x 1.50 x 17 - bc', TRUE, 1.0),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000029', 'ARANDELA LISA DIN 125 M10 BC (10.5 X 20.0 X 2.0)', 'arandela lisa din 125 m10 bc 10.5 x 20.0 x 2.0', TRUE, 1.0),

-- Alias comunes de cables
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Cable Cu Unipolar 2.5mm² Py', 'cable cu unipolar 2.5mm2 py', TRUE, 0.95),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Cond. 1x2.5mm Rojo Cobre', 'cond. 1x2.5mm rojo cobre', TRUE, 0.90),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'CABLE UNIPOLAR INDELPA 2,5 ROJO', 'cable unipolar indelpa 2 5 rojo', TRUE, 0.98)
ON CONFLICT DO NOTHING;

-- 7. Historial de Precios Extraído de las Facturas Reales de Octubre 2026
INSERT INTO price_history (organization_id, canonical_product_id, provider_id, price_pyg, date, source_type, notes) VALUES
-- ENERLUZ S.A.
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000010', 150000, '2026-10-14', 'invoice_photo', 'Factura Electrónica ENERLUZ Nº 001-001-0033088'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000010', 225000, '2026-10-12', 'invoice_photo', 'Factura Electrónica ENERLUZ Nº 001-001-0032949'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000010', 750000, '2026-10-12', 'invoice_photo', 'Factura Electrónica ENERLUZ Nº 001-001-0032949'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000010', 450000, '2026-10-13', 'invoice_photo', 'Factura Electrónica ENERLUZ Nº 001-001-0033018'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000010', 50277, '2026-10-13', 'invoice_photo', 'Factura Electrónica ENERLUZ Nº 001-001-0033018'),

-- FIXOPAR S.A.
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000027', 'c0000000-0000-0000-0000-000000000011', 470, '2026-10-14', 'invoice_photo', 'Factura Electrónica FIXOPAR Nº 001-001-0040993'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000028', 'c0000000-0000-0000-0000-000000000011', 220, '2026-10-14', 'invoice_photo', 'Factura Electrónica FIXOPAR Nº 001-001-0040993'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000029', 'c0000000-0000-0000-0000-000000000011', 88, '2026-10-14', 'invoice_photo', 'Factura Electrónica FIXOPAR Nº 001-001-0040993'),

-- DISYUNTORES ABB
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000012', 67022, '2026-10-10', 'invoice_pdf', 'Nota de entrega pedido ABB'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000012', 67022, '2026-10-10', 'invoice_pdf', 'Nota de entrega pedido ABB'),

-- Cable 2.5 mm² (Condel vs Luminotecnia vs Ferretería antigua)
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 3200, '2026-10-10', 'pdf_pricelist', 'Lista oficial Condel'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 3450, '2026-10-02', 'invoice_photo', 'Factura contado Luminotecnia'),
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 3600, '2026-06-15', 'manual', 'Precio viejo (+120 días)');

-- 8. Facturas Registradas en el Sistema con Vinculación a sus Fotos
INSERT INTO sources (id, organization_id, provider_id, source_type, file_name, file_url, status) VALUES
(
    'fa000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000010',
    'invoice_photo',
    'factura_enerluz_0033088.jpg',
    '/uploads/facturas/factura_enerluz_0033088.jpg',
    'approved'
),
(
    'fa000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000011',
    'invoice_photo',
    'factura_fixopar_0040993.jpg',
    '/uploads/facturas/factura_fixopar_0040993.jpg',
    'approved'
),
(
    'fa000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000010',
    'invoice_photo',
    'factura_enerluz_0032949.jpg',
    '/uploads/facturas/factura_enerluz_0032949.jpg',
    'approved'
),
(
    'fa000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000010',
    'invoice_photo',
    'factura_enerluz_0033018.jpg',
    '/uploads/facturas/factura_enerluz_0033018.jpg',
    'approved'
);

INSERT INTO invoices (
    id, organization_id, source_id, provider_id, invoice_number, timbrado, ruc,
    issue_date, payment_condition, subtotal_pyg, iva_10_pyg, total_pyg, status
) VALUES
(
    'fb000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'fa000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000010',
    '001-001-0033088',
    '17343657',
    '80057523-7',
    '2026-10-14',
    'credito',
    1650000,
    150000,
    1650000,
    'confirmed'
),
(
    'fb000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'fa000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000011',
    '001-001-0040993',
    '18245512',
    '80066137-0',
    '2026-10-14',
    'contado',
    67100,
    6100,
    67100,
    'confirmed'
);

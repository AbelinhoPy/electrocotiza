# Registro de Decisiones de Arquitectura y Producto - ElectroCotiza

Este documento registra todas las decisiones clave de arquitectura, diseño, modelo de datos y reglas de negocio tomadas para la plataforma **ElectroCotiza**, desarrollada a medida para contratistas y electricistas de Paraguay (caso inicial: *Construlogica Emprendimientos S.A.*).

---

## 1. Identidad de Marca y Contexto Local

- **Cliente / Marca Inicial:** Construlogica Emprendimientos S.A.
- **Identidad Gráfica:** 
  - Colores corporativos: Azul Noche (`#0B1B3D` / `#0F2137`), Amarillo Electricidad (`#FBBF24` / `#F59E0B`), Blanco y Dorado (`#D4AF37`) para marcos de presupuestos ejecutivos.
  - Logo oficial integrado desde los activos del cliente (`/assets/logo.png`).
- **Moneda:** Guaraní Paraguayo (PYG, símbolo `₲`).
  - **Sin decimales:** Toda la base de datos almacena los montos como enteros (`BIGINT`), previniendo errores de redondeo de punto flotante.
  - **Formato visual:** Separador de miles con punto (`₲ 1.250.000`), normalizado con `Intl.NumberFormat('es-PY')`.
- **Régimen Tributario:** IVA 10% general paraguayo (DNIT). Los presupuestos al cliente final se expresan siempre con IVA 10% incluido en el valor unitario y total.
- **Proveedores de Referencia:** Ferreterías y distribuidores eléctricos de Asunción, Gran Asunción y Ciudad del Este (Luminotecnia, Record Electric, Condel / Prysmian, Ferretería Central, Casa de la Electricidad, etc.).

---

## 2. Decisiones de Stack Tecnológico

1. **Frontend:**
   - **Next.js 14+ (App Router)** con TypeScript y Tailwind CSS.
   - **Enfoque Mobile-First / PWA:** Los electricistas cargan presupuestos y revisan precios en obra directamente desde su teléfono celular. Contará con manifest PWA (`manifest.json`) y diseño táctil (botones grandes de confirmación rápida, menús deslizables y tablas responsive).
   - Componentes UI inspirados en Radix UI / Shadcn UI con iconos consistentes de `lucide-react`.

2. **Base de Datos y Backend:**
   - **Supabase (PostgreSQL 15+)**:
     - Extensión `pg_trgm` activada para búsqueda difusa (fuzzy search) y homologación de nombres de materiales.
     - Row Level Security (RLS) habilitado para aislamiento multi-inquilino / equipos de trabajo.
     - Almacenamiento (Supabase Storage) para resguardar PDFs de listas de precios, fotos de facturas y logos de clientes.
   - **Capacidad Offline / Local First:** La capa de datos provee abstracciones de repositorio para operar tanto conectado a Supabase como con seeders y mocks enriquecidos para testing y despliegue rápido.

3. **Módulo de Extracción Inteligente (Facturas y Listas PDF):**
   - **Estrategia en dos pasos:**
     - Paso A (PDFs vectoriales/digitales): Extracción de texto y tablas estructuradas directamente para máxima velocidad y coste cero.
     - Paso B (Tickets escaneados / fotos de celular): Modelo multimodal (Gemini 2.5 / Vision) con esquema de salida estrictamente tipado mediante Zod.
   - **Validación matemática obligatoria:** Si la suma de las líneas difiere del total reportado en la factura, el sistema alerta visualmente en rojo antes de permitir la confirmación.

4. **Homologación de Productos y Aprendizaje:**
   - Se separa el **Catálogo Canónico** (`canonical_products`) de las **Variaciones de Nombres** (`product_aliases`).
   - Cada vez que ingresa una descripción desconocida, el algoritmo calcula el coeficiente de similitud trigram (`similarity(alias, query)`) contra el catálogo existente:
     - Coincidencia exacta de alias previo: Aprobación automática sugerida.
     - Similitud > 0.45: Sugerencia destacada con badge de confianza (ej. "92% de coincidencia").
     - Sin coincidencia: Opción de un toque para "Crear nuevo producto maestro" o "Vincular a producto existente".
   - Al confirmar el usuario, la relación se almacena en `product_aliases` con `is_confirmed = true`. De esa forma, el sistema "aprende" para siempre la nomenclatura de cada ferretería.

5. **Comparador y Regla de Precios Desactualizados:**
   - Los precios registran su timestamp exacto.
   - Si un precio tiene más de **60 días** (umbral parametrizable en configuración), se muestra con una insignia de advertencia amarilla/roja `⚠️ Precio Antiguo (+60 días)`.
   - Se calcula automáticamente la variación porcentual ($\% \Delta$) respecto a la última compra registrada del mismo producto.

6. **Generador de Presupuestos y Exportación:**
   - Opciones de precio sugerido para el contratista:
     1. Último precio pagado.
     2. Precio más barato disponible entre proveedores.
     3. Promedio ponderado reciente.
   - Margen de ganancia configurable tanto a nivel global del presupuesto como por ítem individual (materiales vs mano de obra).
   - **Exportación PDF para el Cliente:**
     - Cumple estrictamente con la especificación ejecutiva:
       - Encabezado con logo institucional ("Construlogica Emprendimientos S.A.").
       - Marco exterior dorado elegante (`#D4AF37`).
       - Destinatario formal ("PARA: [Cliente]").
       - Lista de ítems numerados con descripción clara, unidad, cantidad y precio venta final con IVA.
       - **Cero información de costos de compra o nombres de ferreterías proveedoras.**
       - Leyenda legal obligatoria: *"Son Guaraníes [Monto en letras] (IVA 10% incluido en el valor)"*.
       - Condiciones: Plazo de entrega, Forma de pago ("A convenir / Contra entrega"), Validez de 15 días.
       - Pie de página: *"Documento de uso confidencial"*.
   - **Exportación Excel Interno:**
     - Hoja de cálculo completa para el contratista con costos unitarios reales, proveedor de origen, margen aplicado, ganancia estimada y subtotales.

---

## 3. Próximos Pasos de Implementación

- **Fase 1 (MVP Inmediato):**
  - Esquema de base de datos SQL con migraciones y datos seed paraguayos.
  - Setup del proyecto Next.js + Tailwind + TypeScript.
  - Catálogo canónico, homologador con `pg_trgm`, buscador de materiales y comparador de proveedores.
  - Creador interactivo de presupuestos con cálculo de margen.
  - Generador de PDF con marco dorado y Excel interno.
- **Fase 2:** Integración de extracción OCR / multimodal de facturas con pantalla dividida (Human-in-the-Loop) y conectores web.
- **Fase 3:** Stock básico de sobrantes de obra y reportes analíticos de compras.

# ElectroCotiza ⚡🇵🇾

**Plataforma Web Responsive y PWA de Cotizaciones y Homologación de Precios Eléctricos para Contratistas y Electricistas de Paraguay.**  
Caso de uso inicial: **Construlogica Emprendimientos S.A.** (Minga Guazú / Ciudad del Este / Asunción).

---

## 🚀 Características Principales

1. **Catálogo Maestro y Motor de Homologación (`pg_trgm` / Trigramas):**
   - Unifica las distintas denominaciones de materiales utilizadas por ferreterías paraguayas (ej: *"BARRAM. COBRE 20X3MM 3/4X1/8"*, *"Barra Cobre 20x3 Enerluz"*, *"Planchuela de cobre 20x3mm"* unificadas bajo un único producto maestro).
   - Coincidencia difusa en tiempo real con cálculo de porcentaje de similitud.
   - Confirmación humana con un toque para recordar nuevos alias permanentemente.

2. **Validación Humana (Human-in-the-Loop):**
   - Pantalla dividida con visor de zoom para fotos de facturas o tickets (KuDE).
   - Verificación matemática instantánea: compara la sumatoria de las líneas extraídas contra el total declarado en la factura con alertas visuales de discrepancia.
   - Viene pre-cargado con **5 facturas reales de Construlogica Emprendimientos S.A.** (ENERLUZ S.A., FIXOPAR S.A. y ELECTRO SYSTEM / ABB).

3. **Buscador Comparativo de Precios:**
   - Visualiza dónde conviene comprar cada material (precios más baratos destacados).
   - **Alerta de Precios Viejos:** Distintivo de advertencia si la cotización supera los **60 días** (evita pérdidas por inflación o variaciones de mercado).
   - Historial de precios por proveedor y fecha.

4. **Creador Rápido de Presupuestos (< 5 minutos en obra):**
   - Diseñado mobile-first para operarse desde el teléfono en la obra.
   - Selector rápido de materiales con sugerencia de precios (Último precio pagado o más barato).
   - Plantillas de mano de obra (boca, global, día de trabajo).
   - Margen de ganancia configurable tanto a nivel global como por ítem.
   - Cálculos en **Guaraníes (PYG, ₲) sin decimales** con **IVA 10% incluido**.

5. **Exportador Dual:**
   - **PDF Ejecutivo para el Cliente:**
     - Membrete oficial de **Construlogica Emprendimientos S.A.**
     - **Marco exterior dorado elegante (`#D4AF37`)**.
     - Ítems numerados con descripción, unidad, cantidad y precio unitario con IVA.
     - **Confidencialidad absoluta:** Cero filtración de costos de compra ni nombres de proveedores.
     - Leyenda legal obligatoria: *"Son Guaraníes [Monto en letras] (IVA 10% incluido en el valor)"*.
     - Condiciones de entrega, forma de pago, validez de 15 días y pie de confidencialidad.
   - **Excel Interno de Auditoría:**
     - Desglose con costos unitarios reales, proveedor de referencia, margen aplicado, ganancia bruta estimada y subtotales.

---

## 🛠️ Tecnologías

- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **PWA:** Web App Manifest para instalación en Android / iPhone.
- **Base de Datos:** PostgreSQL 15+ / Supabase con extensión `pg_trgm`, triggers y funciones RPC.
- **Exportación:** jsPDF + AutoTable (PDF vectorizado) y XLSX (Excel).
- **Persistencia Local-First:** Funciona de inmediato con datos reales en memoria / LocalStorage y cuenta con esquemas SQL para conexión a Supabase Cloud.

---

## 📦 Instalación y Ejecución Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador (o desde el celular en la misma red Wi-Fi).

3. **Compilar para producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 🗄️ Esquema de Base de Datos (Supabase / PostgreSQL)

- **DDL Completo:** [`supabase/schema.sql`](supabase/schema.sql)
- **Datos Semilla (Seed con Facturas Reales):** [`supabase/seed.sql`](supabase/seed.sql)

Para desplegar en Supabase:
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. Luego ejecuta [`supabase/seed.sql`](supabase/seed.sql).

---

## 📄 Archivo de Decisiones

Consulta [`DECISIONES.md`](DECISIONES.md) para conocer las justificaciones técnicas y de producto adoptadas en el proyecto.

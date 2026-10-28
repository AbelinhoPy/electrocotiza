# ElectroCotiza ⚡
### Plataforma de Gestión Comercial y Técnica para Instalaciones Eléctricas, Automatización y Montaje Industrial
*Desarrollado para empresas de servicios electromecánicos en **Paraguay** (Referencia operativa: Construlogica Emprendimientos S.A.)*

[![CI Pipeline](https://github.com/AbelinhoPy/electrocotiza/actions/workflows/ci.yml/badge.svg)](https://github.com/AbelinhoPy/electrocotiza/actions)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)
![PostgreSQL / Neon](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169e1?style=flat&logo=postgresql)
![Moneda](https://img.shields.io/badge/Moneda-Guaran%C3%ADes_(Gs.)_|_USD-amber?style=flat)

---

## 🎯 Visión General

**ElectroCotiza** es una plataforma web integral diseñada para resolver de punta a punta la operativa comercial, técnica y de compras de empresas paraguayas dedicadas al montaje de tableros (TGD, CCM), instalaciones eléctricas industriales, canalizaciones y automatización.

Sustituye la gestión informal (planillas de cálculo vulnerables, consultas en papel o chats de WhatsApp) por una arquitectura conectada con persistencia dual (**Local-First** en navegador + **PostgreSQL Neon Serverless**), motor de cálculo comercial estricto, emisión de 4 documentos PDF normativos y trazabilidad completa desde la cotización hasta la recepción de materiales en obra.

---

## 🏛️ Módulos Principales del Sistema

### 1. Asistente Consecutivo de Presupuestación (8 Etapas)
Numeración comercial automática correlativa **`PRES-AAAA-NNNN`** con control de revisiones inmutables (`rev 0`, `rev 1`, ...):
1. **Datos Generales:** Cliente, validez en días, moneda (PYG/USD), cotización cambiaria, tasa de IVA (10%), notas visibles e internas.
2. **Equipos y Accionamientos:** Bombas de presurización, motores, compresores, tableros seccionales y su ubicación física en planta.
3. **Materiales por Subgrupos:** Estructura jerárquica (Tablero de Fuerza, Iluminación, Canalizaciones). Homologación automática contra precios de proveedores.
4. **Mano de Obra:** Cálculo dual mediante **Horas-Hombre** (categoría técnica, cantidad de operarios y horas) o **Servicios de Catálogo** (por boca, global, etc.), con flag anti-duplicación de cobro.
5. **Logística y Desplazamiento:** Movilidad por km, viáticos diarios por persona, fletes con grúa pluma y alquiler de andamios.
6. **Cronograma y Plazos:** Estimación de semanas, tareas asignadas y dependencias.
7. **Resumen de Rentabilidad y Descuentos:** Control de margen sobre venta, desglose de costo vs venta. **Alerta y bloqueo si el descuento supera el 20%** (requiere solicitud y aprobación de Gerencia/Admin) y **bloqueo estricto si el precio final cae por debajo del costo**.
8. **Emisión de Documentos y Cierre:** Generación instantánea de los 4 documentos PDF oficiales y conversión a proyecto.

---

### 2. Motor de Cálculo Comercial (`PricingEngine`)
Reglas matemáticas centralizadas y reutilizables en todo el sistema:
- **Margen sobre Venta:** $\text{Precio} = \frac{\text{Costo}}{1 - \text{Margen}}$ (un costo de 60.000 Gs. con 40% de margen resulta en 100.000 Gs. de venta).
- **Recargo sobre Costo (Markup):** $\text{Precio} = \text{Costo} \times (1 + \text{Markup})$ (un costo de 60.000 Gs. con 40% de markup resulta en 84.000 Gs.).
- **Normalización de IVA Compra:** $\text{Costo Neto} = \frac{\text{Precio con IVA}}{1.10}$ para evitar que el crédito fiscal infle erróneamente el costo de los materiales.
- **Aritmética Entera en Guaraníes:** Sin decimales de coma flotante en moneda local para cumplir con la legislación impositiva de Paraguay.

---

### 3. Los 4 Documentos PDF Oficiales
Generados con motor `jsPDF` con estándares de confidencialidad industrial:
1. **Lista de Materiales para Obra (Sin Precios):** Especificaciones técnicas, marcas, modelos y cantidades para el pañolero o electricista en obra.
2. **Lista Comercial de Precios:** Tarifario unificado de materiales y servicios para el equipo de ventas.
3. **Presupuesto Ejecutivo para Cliente:** Membrete corporativo, **marco perimetral dorado (`#D4AF37`)**, cláusula legal en letras (*"Son Guaraníes [en letras] (IVA 10% incluido)"*), términos comerciales y datos bancarios SIPAP. **Cero filtración de costos o nombres de ferreterías.**
4. **Resumen Interno Confidencial de Costos y Rentabilidad:** Detalle por proveedor (Enerluz, Fixopar, Condel, Electro System, Luminotecnia), costo unitario, margen real, ganancia estimada y marca de agua confidencial.

---

### 4. Proyectos y Materiales en Obra (`PROY-AAAA-NNNN`)
- Conversión en 1 clic de presupuestos aprobados a proyectos de ejecución.
- Matriz de seguimiento de materiales en 4 estados: **Requerido**, **Recibido**, **Instalado** y **Pendiente**.
- Registro de órdenes de cambio de alcance con impacto económico aprobado.

---

### 5. Control Multi-Depósito e Inventario
- 3 Almacenes preconfigurados: **Almacén Central Asunción**, **Taller de Montaje de Tableros** y **Pañol Móvil de Obra**.
- Control de stock físico, reservado para proyectos y disponible.
- Movimientos Kárdex: Entradas por compras, salidas a obra, transferencias y reservas.

---

### 6. Finanzas, Cobranzas y Gastos de Obra
- Cronograma de hitos de cobro por proyecto: **Anticipo 30%** (acopio de materiales), **Entrega y Montaje 40%**, **Comisionamiento y Pruebas 30%**.
- Registro de cobros parciales o totales con vinculación a N° de Recibo Oficial o transferencia SIPAP.
- Registro de desembolsos de obra categorizados (material adicional, fletes, viáticos, subcontratos) y balance de caja en tiempo real.

---

### 7. Órdenes de Servicio Técnico (OS) y Checklists Normativos ANDE
- Emisión de **`OS-AAAA-NNNN`** con horas reales vs estimadas y registro de materiales utilizados.
- Protocolos de inspección basados en normativas ANDE: Pruebas de disparo diferencial en 30ms, resistencia de puesta a tierra (< 5 Ω), grado de protección IP y torque dinanométrico de borneras.

---

### 8. Importador de Facturas Electrónicas XML (SIFEN / e-Kuatia)
- Parser XML seguro contra ataques XXE (*XML External Entity*).
- Extracción de datos del timbrado, RUC del emisor, fecha, ítems, precios unitarios e IVA.
- Homologación directa al catálogo de productos canónicos.

---

## 👥 Control de Acceso y Roles (RBAC)

El sistema cuenta con un selector de perfiles interactivo en la barra superior para alternar instantáneamente entre los 5 roles predefinidos:

| Rol | Usuario de Demostración | Permisos Principales |
|---|---|---|
| **Administrador** | `admin@construlogica.com.py` | Acceso total, configuración fiscal, aprobación de descuentos > 20%, visualización de costos y rentabilidad. |
| **Presupuestista** | `presupuestos@construlogica.com.py` | Creación de presupuestos, selección de materiales y proveedores, mano de obra, logística y visualización de costos. |
| **Vendedor** | `ventas@construlogica.com.py` | Gestión de clientes y cotizaciones, precios de venta, límite de descuento hasta 20%. **Costos y proveedores ocultos**. |
| **Técnico / Supervisor**| `tecnico@construlogica.com.py` | Consulta de obras, registro de avance, ejecución de checklists ANDE, recepción de materiales y órdenes de servicio. |
| **Auditor / Consulta** | `auditor@construlogica.com.py` | Acceso de solo lectura a presupuestos y proyectos. Registro inmutable de eventos. |

---

## 💻 Instalación y Puesta en Marcha

### Requisitos Previos
- Node.js 18+ (recomendado Node.js 20 LTS)
- npm o pnpm

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/AbelinhoPy/electrocotiza.git
cd electrocotiza

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:3000
```

### Ejecución de Pruebas Automatizadas

```bash
# Ejecuta la suite de 23 tests de lógica de negocio, pruebas del motor de cálculo y auditoría de PDF
npm test

# Verificación de tipos TypeScript estricta
npx tsc --noEmit
```

---

## 🗄️ Base de Datos y Persistencia

El repositorio incluye el archivo de definición DDL completo en:
- [`supabase/schema.sql`](supabase/schema.sql): 25 tablas relacionales con claves foráneas, índices trigram (`pg_trgm`) para búsqueda difusa de materiales, triggers de normalización de texto y funciones de búsqueda inteligente.
- Variables de entorno (`.env.local`): Conexión directa a PostgreSQL en la nube (Neon / Supabase) con degradación elegante (*graceful fallback*) a almacenamiento local cuando no hay conexión de red.

---

## 📄 Licencia

Desarrollado para el sector industrial y electromecánico de la República del Paraguay.  
Todos los derechos reservados.

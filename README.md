# ElectroCotiza ⚡
### Sistema Inteligente de Homologación de Materiales y Presupuestos Eléctricos para Paraguay
*Desarrollado a medida para contratistas y profesionales de **Construlogica Emprendimientos S.A.***

[![CI Pipeline](https://github.com/AbelinhoPy/electrocotiza/actions/workflows/ci.yml/badge.svg)](https://github.com/AbelinhoPy/electrocotiza/actions)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)
![PWA Ready](https://img.shields.io/badge/PWA-Mobile--First-emerald?style=flat&logo=pwa)
![Moneda](https://img.shields.io/badge/Moneda-Guaran%C3%ADes_(%E2%82%B2)-amber?style=flat)

---

## 🎯 ¿Qué problema resuelve ElectroCotiza?

Un electricista o contratista en Paraguay hace presupuestos todos los días y pierde valiosas horas:
- Buscando precios en tickets viejos arrugados, remisiones y mensajes de WhatsApp.
- El mismo producto se llama diferente en cada ferretería (`BARRAM. COBRE 20X3MM` vs `Planchuela de cobre 20x3mm` vs `Barra Cobre 20x3 Enerluz`).
- Confecciona cotizaciones en Excel o papel que filtran por error el margen o los proveedores de compra.
- Trabaja con precios viejos que se comió la inflación.

**ElectroCotiza centraliza todo el flujo en el celular o la computadora:**
1. **Homologa automáticamente** los nombres de materiales con búsqueda difusa (trigram similarity).
2. **Compara precios** en tiempo real entre ferreterías de Asunción y Alto Paraná (Enerluz, Fixopar, Electro System, Electropar, Luminotecnia, Condel, Centro de los Compresores).
3. **Escanea facturas reales** (por foto o carga manual) garantizando que la suma matemática sea 100% exacta.
4. **Arma presupuestos ejecutivos en menos de 5 minutos** con cálculo automático de IVA 10% y margen de ganancia.
5. **Exporta PDFs de alta gama con marco dorado (`#D4AF37`)** con estricta confidencialidad (cero nombres de ferreterías ni costos de compra).
6. **Comparte por WhatsApp en 1 toque** y permite al cliente transferir el anticipo por SIPAP con un botón de copiado.

---

## 🚀 Características Principales

### 1. Catálogo Maestro y Homologador Inteligente
- Algoritmo de similitud semántica y trigramas (`pg_trgm`) adaptado a las abreviaturas eléctricas del mercado paraguayo (`barram`, `cond`, `sx`, `din`, `disy`, etc.).
- Aprendizaje continuo: cuando vinculas un nuevo alias de ferretería, el sistema lo recuerda para siempre.

### 2. Comparador de Precios y Detector de Precios Viejos
- Muestra el proveedor más económico para cada material y la variación porcentual ($\% \Delta$).
- Si una cotización tiene más de **60 días**, el sistema muestra una advertencia visual amarilla/roja para evitar pérdidas comerciales.

### 3. Escáner Dual de Facturas (Foto Inteligente + Carga Manual)
- **Modo Foto / Celular:** Visor en pantalla dividida con controles táctiles de zoom y rotación para verificar comprobantes en obra.
- **Modo Carga Manual:** Ideal para tickets térmicos arrugados o de bajo contraste (como Fixopar o ferreterías barriales).
- **Balance Matemático Estricto:** Compara en tiempo real la sumatoria de las líneas contra el total facturado. Bloquea la confirmación si no balancea.

### 4. Presupuestos en < 5 Minutos (Mobile-First)
- Selector de materiales con precio sugerido (último pagado, más barato o promedio).
- Plantillas de mano de obra paraguaya (por boca, por día, global de tablero, acometida).
- Control de margen global o individual por línea.

### 5. Exportación Dual y Venta por WhatsApp
- **PDF de Cliente:** Membrete de Construlogica, marco dorado exterior, destinatario `"PARA:"`, leyenda legal en guaraníes en letras (*"Son Guaraníes [en letras] (IVA 10% incluido)"*), validez de 15 días y pie de confidencialidad. **Cero filtración de costos o proveedores.**
- **Excel Interno:** Hoja de cálculo con costos reales, proveedores, márgenes y utilidad neta estimada.
- **WhatsApp Directo:** Envío del resumen formal en un clic al número del cliente.
- **Datos Bancarios SIPAP:** Copiado instantáneo al portapapeles de la cuenta bancaria para pago de anticipo.

### 6. Sistema Anti-Pérdidas de Datos (Backup & Restore JSON)
- Exportación e importación de toda la base de datos (precios, clientes, facturas, presupuestos) en formato JSON en un solo clic. Permite migrar entre teléfonos y PCs sin riesgo de perder información.

### 7. Login y Control de Roles
- Perfiles de acceso rápido para demostración inmediata:
  - **Dueño / Jefe de Obra** (*Ing. Abel K.*): Control total de costos, márgenes y configuración fiscal.
  - **Electricista / Técnico**: Creación de presupuestos y carga de facturas en campo.
  - **Administrador**: Gestión de usuarios y respaldos.

---

## 🏗️ Facturas Reales de Paraguay Incluidas

El sistema viene preentrenado con **9 facturas reales** de las principales ferreterías y distribuidores de Paraguay:

1. **ELECTRO SYSTEM S.R.L. #005-001-0004935** (3.822.735 ₲): Disyuntores de potencia Chint 400A/630A, TIs 800/5A y ventilación.
2. **CENTRO DE LOS COMPRESORES S.A. #001-001-0041585** (338.500 ₲): Tubos y accesorios Top Fusion PN20 25mm.
3. **CENTRO DE LOS COMPRESORES S.A. #001-001-0041554** (60.000 ₲): Uniones de termofusión 32mm.
4. **ELECTROPAR S.A. #015-002-0022390** (465.600 ₲): Rollo 200m Cable Multifilar Atóxico 2.0 mm² Nexans (Tierra).
5. **ENERLUZ S.A. #001-001-0033088** (1.650.000 ₲): Barras de cobre electrolítico 20x3mm 3/4" x 1/8".
6. **FIXOPAR S.R.L. #001-001-0040993** (67.100 ₲): Bulones acero 8.8 M10x25, tuercas y arandelas DIN 125.
7. **ENERLUZ S.A. #001-001-0032949** (3.372.704 ₲): Barras de cobre 30x5mm, 50x10mm y microrruptores.
8. **ENERLUZ S.A. #001-001-0033018** (1.500.831 ₲): Barras 30x10mm y cablecanales ranurados PVC 40x50mm.
9. **ELECTRO SYSTEM / ABB #PED-4235575** (536.176 ₲): Disyuntores tripolares DIN SH203 3P 20A y 25A.

---

## 💻 Pila Tecnológica

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **PWA / Móvil:** Responsive Mobile-First, Web App Manifest, Service-Worker ready.
- **Generadores:** `jspdf` + `jspdf-autotable` (PDF ejecutivo) y `xlsx` (Excel interno).
- **Base de Datos & Búsqueda:** Arquitectura Local-First con persistencia `localStorage`, lista para conectarse a **Supabase (PostgreSQL 15+)** con extensión `pg_trgm`.
- **Despliegue:** Optimizado para **Vercel** (`vercel.json`) y contenedores **Docker** (`Dockerfile` multi-stage).

---

## 🛠️ Instalación y Uso Local

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

---

## 🧪 Pruebas Automatizadas

El proyecto incluye una suite completa de pruebas de lógica de negocio y de confidencialidad:

```bash
# Ejecutar suite de pruebas de negocio (23 tests: cálculos, IVA 10%, balance matemático y trigramas)
node tests/verification.mjs

# Ejecutar auditoría de confidencialidad en PDF (verifica 0% de filtración de costos o proveedores)
node tests/test-pdf-export.mjs

# Compilación de producción
npm run build
```

---

## 🚀 Despliegue en Producción

Consulta la guía detallada en [DEPLOYMENT.md](DEPLOYMENT.md) para desplegar en:
- **Vercel:** Importación en 1 clic desde GitHub (Recomendado).
- **Docker / VPS:** Contenedor optimizado y listo para correr en cualquier nube.
- **Supabase:** Base de datos PostgreSQL con migraciones en `supabase/schema.sql` y `supabase/seed.sql`.

---

## 📄 Licencia y Derechos

Propiedad de **Construlogica Emprendimientos S.A.** - Asunción, Paraguay.  
Todos los derechos reservados.

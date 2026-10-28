# Manual de Usuario y Operaciones - ElectroCotiza ⚡
### Guía Operativa para Gestión Comercial y Técnica de Instalaciones Eléctricas e Industriales

---

## 1. Introducción y Acceso al Sistema

ElectroCotiza es una plataforma web optimizada para su uso en computadoras de escritorio, tablets y teléfonos móviles en obra.

### Perfiles de Usuario Disponibles
En la barra superior de navegación, puedes alternar entre los distintos roles del sistema utilizando el menú desplegable de perfil:
- **Administrador (Ing. Lucas Duré):** Acceso integral a todas las funciones, costos reales, márgenes de ganancia, aprobación de descuentos y configuración del sistema.
- **Presupuestista (Carlos Benítez):** Elaboración y edición de cotizaciones, selección de materiales, cálculo de mano de obra y logística.
- **Vendedor (Mariana Duarte):** Gestión comercial con clientes y cotizaciones. Por razones de confidencialidad, **los costos de compra de proveedores están ocultos** para este rol y los descuentos están limitados al 20%.
- **Técnico / Supervisor (Ramón Fleitas):** Control de ejecución en obras, recepción de materiales en obra, emisión de órdenes de servicio y ejecución de protocolos ANDE.
- **Consulta / Auditor (Lic. Sofía Vega):** Consulta de solo lectura de presupuestos, proyectos e historial de auditoría.

---

## 2. Flujo Completo de Presupuestación (8 Etapas)

Para crear un nuevo presupuesto, dirígete a **Presupuestos** en la barra de navegación y presiona **"Nuevo Presupuesto"**. El sistema te guiará a través de 8 pasos consecutivos:

### Paso 1: Datos Generales
- Selecciona el cliente existente o crea uno nuevo con su RUC o Cédula de Identidad.
- Asigna un nombre al proyecto (ej. *"Montaje de Tablero Principal y Alimentadores Fábrica Santa María"*).
- Configura la validez de la oferta (predeterminado: 15 días corridos).
- Selecciona la moneda (Guaraníes Gs. o Dólares USD) y verifica la cotización cambiaria.
- Ingresa las notas visibles (que aparecerán en la propuesta final) y notas internas (visibles solo para el equipo).

### Paso 2: Equipos o Accionamientos
- Registra las máquinas, motores o tableros involucrados en el proyecto (ej. *"Bomba de Presurización 15HP"*, *"Compresor de Tornillo 30kW"*).
- Especifica la ubicación física en planta y las características electromecánicas (voltaje, corriente nominal, tipo de arranque suave o convertidor de frecuencia).

### Paso 3: Materiales por Subgrupos
- Organiza los materiales en grupos lógicos (ej. *"Gabinete y Protecciones"*, *"Alimentadores Principales"*, *"Iluminación y Tomacorrientes"*).
- Utiliza el buscador inteligente para agregar materiales del catálogo unificado.
- El sistema precarga automáticamente el último precio registrado de proveedores paraguayos (Enerluz, Fixopar, Condel, Electro System, Electropar, Luminotecnia).
- Si el material fue provisto por el cliente, marca la casilla correspondiente para excluir su costo pero mantenerlo en la lista técnica.

### Paso 4: Mano de Obra
El sistema ofrece dos métodos de cálculo que pueden combinarse:
- **Por Horas-Hombre:** Selecciona la categoría del operario (Oficial Electricista, Especialista en Automatización, Ayudante), la tarifa horaria, la cantidad de horas estimadas y el número de operarios.
- **Por Servicio de Catálogo:** Selecciona un servicio preconfigurado del tarifario (ej. *"Montaje de Tablero TGD"*, *"Punto de Iluminación o Toma"*).
- **Protección anti-duplicación:** Si un trabajo ya está cubierto por otro concepto global, puedes marcarlo para evitar cobros dobles al cliente.

### Paso 5: Gastos Logísticos y Desplazamiento
- Calcula movilidad por kilómetro recorrido para vehículos de obra.
- Viáticos diarios por persona para técnicos trasladados fuera del área metropolitana.
- Fletes con grúa pluma para traslado de tableros pesados o alquiler de andamios certificados.

### Paso 6: Cronograma de Trabajo
- Define las tareas técnicas clave, fechas estimadas de inicio y culminación, horas previstas y dependencias entre etapas.

### Paso 7: Revisión de Rentabilidad y Descuentos
- El sistema muestra el resumen económico con costo total, precio de venta sugerido y margen proyectado.
- **Política de Descuentos:**
  - Descuentos de hasta el **20%** son aplicados directamente por el presupuestista o vendedor.
  - Si ingresas un descuento **superior al 20%**, el sistema activará automáticamente una solicitud de autorización que debe ser aprobada por el Administrador antes de emitir la oferta formal.
  - **Bloqueo de seguridad:** Si un descuento hace que el precio final sea inferior al costo de compra, el sistema bloqueará la operación para proteger la rentabilidad de la empresa.

### Paso 8: Cierre y Emisión de Documentos
- Genera el presupuesto con su número correlativo oficial **`PRES-AAAA-NNNN`**.
- Descarga cualquiera de los **4 documentos PDF oficiales**:
  1. *Lista de Materiales para Obra (sin precios).*
  2. *Lista Comercial de Precios.*
  3. *Presupuesto Ejecutivo para Cliente (con marco dorado `#D4AF37` y datos bancarios SIPAP).*
  4. *Resumen Interno Confidencial de Costos y Rentabilidad.*

---

## 3. Conversión de Presupuesto a Proyecto de Obra

1. En el listado de presupuestos, cuando el cliente aprueba la propuesta comercial, cambia el estado a **Aprobado**.
2. Presiona el botón **"Convertir a Proyecto"**.
3. El sistema creará automáticamente un proyecto con código correlativo **`PROY-AAAA-NNNN`**, transfiriendo todos los materiales, tareas de cronograma y el monto total contratado.

---

## 4. Seguimiento de Materiales en Obra

En el módulo de **Proyectos**, accede al detalle del proyecto para controlar la matriz de materiales:
- **Cantidad Requerida:** Determinada por el presupuesto aprobado.
- **Cantidad Recibida:** Ingresos confirmados desde almacén central o proveedores directos a obra.
- **Cantidad Instalada:** Materiales fijados y conectados físicamente en la instalación.
- **Cantidad Pendiente:** Faltantes calculados automáticamente en tiempo real.

---

## 5. Control de Almacenes e Inventario

Accede a **Inventario** para visualizar las existencias en los tres depósitos:
- **Almacén Central Asunción:** Depósito principal de acopio.
- **Taller de Montaje de Tableros:** Componentes asignados a armado de gabinetes y cableado de canaletas.
- **Pañol Móvil de Obra:** Herramientas y materiales de consumo en sitio.

### Registrar Movimiento Kárdex
Presiona **"Registrar Movimiento"** y selecciona:
- **Entrada:** Ingreso por compra de proveedor.
- **Salida:** Despacho para instalación o servicio.
- **Transferencia:** Traspaso entre almacenes (ej. Central hacia Pañol Obra).
- **Reserva para Proyecto:** Bloqueo de stock para una obra específica sin permitir que otro presupuestista lo asigne.

---

## 6. Finanzas, Cobranzas y Gastos de Obra

En el módulo **Finanzas**, puedes llevar el control del flujo de caja de los contratos:

### Hitos Contractuales de Cobro
El sistema estructura automáticamente los 3 hitos típicos de la industria en Paraguay:
1. **Anticipo 30%:** Para compra y acopio inicial de conductores y aparamenta.
2. **Entrega de Tableros y Montaje 40%:** Al recibir los gabinetes en obra y tender bandejas.
3. **Puesta en Marcha y Aprobación 30%:** Saldo final tras comisionamiento y pruebas bajo tensión.

- Para registrar un pago recibido, presiona **"Cobrar"** en el hito correspondiente, ingresa el monto percibido y el número de **Recibo Oficial** o comprobante de transferencia bancaria SIPAP.

### Desembolsos y Gastos Operativos de Obra
Presiona **"Registrar Gasto de Obra"** para asentar gastos imprevistos, viáticos de cuadrillas o fletes especiales, vinculándolos a su número de factura de compra.

---

## 7. Órdenes de Servicio y Protocolos de Inspección ANDE

### Órdenes de Servicio Técnico (OS)
- Emite órdenes con código **`OS-AAAA-NNNN`** para mantenimientos correctivos o instalaciones puntuales.
- Registra horas estimadas vs. horas reales de campo y lista de materiales utilizados.
- Genera el comprobante imprimible con espacio para firma y conformidad del cliente.

### Checklists Normativos ANDE
Accede a **Checklists** para ejecutar auditorías técnicas en campo:
- **Verificación Mecánica:** Grado de protección IP del gabinete, identificación termoendogible de cables y chapa de advertencia de riesgo eléctrico.
- **Mediciones Eléctricas:** Disparo del interruptor diferencial (debe actuar dentro de los 30 ms) y resistencia de puesta a tierra (debe arrojar un valor inferior a $5.0\ \Omega$).
- Clasificación del resultado general: **Aprobado**, **Observado** o **Rechazado**.

---

## 8. Importación de Facturas Electrónicas XML (SIFEN)

1. Ingresa a **XML SIFEN**.
2. Arrastra o selecciona el archivo XML de la factura electrónica emitida por tu proveedor bajo el estándar e-Kuatia (SIFEN).
3. El sistema valida la integridad del archivo y extrae automáticamente los datos del timbrado, RUC del emisor, ítems comprados y precios unitarios.
4. Presiona **"Confirmar e Incorporar al Catálogo"** para actualizar el historial de precios y mantener tus costos de reposición al día.

---

## 9. Respaldos y Protección de Datos

En el módulo **Ajustes / Configuración**:
- **Descargar Copia de Seguridad:** Genera un archivo JSON con toda la base de datos (precios, clientes, presupuestos, facturas e historial).
- **Restaurar Copia de Seguridad:** Permite cargar una copia previa para migrar entre dispositivos o recuperar información de manera instantánea.

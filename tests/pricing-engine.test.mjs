// Test suite para verificar el Motor de Cálculo Comercial (PricingEngine)
import { PricingEngine } from '../src/lib/pricing-engine.ts';

console.log('⚡ PRUEBAS AUTOMATIZADAS DEL MOTOR DE CÁLCULO COMERCIAL (PRICING ENGINE)');
console.log('======================================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. Margen sobre Venta vs Recargo sobre Costo (Ejemplo Canónico del Enunciado)
console.log('\n--- 1. Margen sobre Venta vs Recargo sobre Costo ---');
const cost = 60000;
const margin40 = PricingEngine.calculateSalePriceFromMargin(cost, 40, 'PYG');
assert(margin40 === 100000, `Margen 40% sobre venta: Costo 60.000 -> 100.000 Gs (actual: ${margin40})`);

const markup40 = PricingEngine.calculateSalePriceFromMarkup(cost, 40, 'PYG');
assert(markup40 === 84000, `Recargo 40% sobre costo: Costo 60.000 -> 84.000 Gs (actual: ${markup40})`);

// 2. Políticas de Descuento y Autorizaciones (Ejemplo Canónico del Enunciado)
console.log('\n--- 2. Políticas de Descuento y Bloqueos de Seguridad ---');
// A. Descuento 20%: precio 80.000 (permitido sin autorización)
const v20 = PricingEngine.validateDiscount(cost, margin40, 20, 20, 'PYG');
assert(v20.allowed === true, `Descuento 20% está permitido`);
assert(v20.requiresApproval === false, `Descuento 20% no requiere aprobación especial`);
assert(v20.finalPrice === 80000, `Precio final con 20% desc = 80.000 Gs (actual: ${v20.finalPrice})`);

// B. Descuento 30%: precio 70.000 (requiere autorización de administrador)
const v30 = PricingEngine.validateDiscount(cost, margin40, 30, 20, 'PYG');
assert(v30.allowed === true, `Descuento 30% está permitido si se autoriza`);
assert(v30.requiresApproval === true, `Descuento 30% REQUIERE autorización administrativa (> 20%)`);
assert(v30.finalPrice === 70000, `Precio final con 30% desc = 70.000 Gs (actual: ${v30.finalPrice})`);

// C. Descuento 50%: precio 50.000 (por debajo de costo 60.000 -> Bloqueado)
const v50 = PricingEngine.validateDiscount(cost, margin40, 50, 20, 'PYG');
assert(v50.allowed === false, `Descuento 50% debe ser BLOQUEADO`);
assert(v50.belowCost === true, `Descuento 50% detectado como venta bajo costo`);
assert(v50.finalPrice === 50000, `Precio resultante es 50.000 < 60.000 costo`);

// 3. Normalización de Precios de Compra con IVA
console.log('\n--- 3. Normalización de IVA Compra ---');
// Compra de 110.000 con IVA 10% incluido -> Costo neto es 100.000
const netCost = PricingEngine.normalizePurchaseCost(110000, true, 10);
assert(netCost === 100000, `Costo neto normalizado de 110.000 Gs (IVA inc) -> 100.000 Gs (actual: ${netCost})`);

// 4. Mano de Obra: Horas Hombre vs Servicio y Concepto Cubierto
console.log('\n--- 4. Fórmulas de Mano de Obra ---');
const laborLine1 = {
  method: 'man_hours',
  hourly_rate_pyg: 50000,
  hours_per_worker: 8,
  worker_count: 2,
  is_included_in_quote: true,
  covered_by_other_concept: false
};
const laborTotal1 = PricingEngine.calculateLaborTotal(laborLine1);
// 50.000 * 8 * 2 = 800.000 Gs
assert(laborTotal1 === 800000, `Horas hombre: 50.000 * 8h * 2 técnicos = 800.000 Gs (actual: ${laborTotal1})`);

const laborLineCovered = {
  ...laborLine1,
  covered_by_other_concept: true
};
const laborCoveredTotal = PricingEngine.calculateLaborTotal(laborLineCovered);
assert(laborCoveredTotal === 0, `Concepto cubierto por otro servicio suma 0 Gs para evitar duplicación`);

// 5. Gastos Logísticos: Fórmulas Explícitas
console.log('\n--- 5. Gastos Logísticos ---');
// A. Movilidad: 150 km * 2.500 Gs/km
const logMobility = {
  concept_type: 'km_mobility',
  unit_rate_pyg: 2500,
  quantity: 150,
  margin_pct: 0,
  is_included_in_quote: true
};
const { cost: mobCost, sale: mobSale } = PricingEngine.calculateLogisticsTotal(logMobility);
assert(mobCost === 375000 && mobSale === 375000, `Movilidad: 150 km * 2.500 Gs = 375.000 Gs`);

// B. Viáticos: 3 personas * 4 días * 120.000 Gs
const logPerDiem = {
  concept_type: 'daily_per_diem',
  unit_rate_pyg: 120000,
  people_count: 3,
  days_or_nights: 4,
  margin_pct: 0,
  is_included_in_quote: true
};
const { cost: pdCost } = PricingEngine.calculateLogisticsTotal(logPerDiem);
// 3 * 4 * 120.000 = 1.440.000 Gs
assert(pdCost === 1440000, `Viáticos: 3 personas * 4 días * 120.000 Gs = 1.440.000 Gs`);

// 6. Cálculo Integral de Presupuesto con Subtotal Neto, IVA 10% y Rentabilidad
console.log('\n--- 6. Cálculo Integral del Presupuesto ---');
const sampleQuote = {
  currency: 'PYG',
  global_margin_pct: 30,
  pricing_method: 'margin',
  items: [
    {
      description: 'Disyuntor 3x63A ABB',
      quantity: 2,
      unit_cost_pyg: 210000, // Costo 210.000 con 30% margen -> 300.000 venta
      unit_sale_pyg: 300000,
      margin_pct: 30,
      discount_pct: 0,
      is_excluded_or_client_provided: false
    }
  ],
  labor_lines: [laborLine1], // 800.000 venta
  logistics_lines: [logMobility] // 375.000 venta
};

const totals = PricingEngine.calculateQuoteTotals(sampleQuote, 10);
// Materiales venta: 600.000
// Mano de obra venta: 800.000
// Logística venta: 375.000
// Subtotal neto: 1.775.000
// IVA 10%: 177.500
// Total: 1.952.500
assert(totals.totalMaterialsSale === 600000, `Materiales venta: 600.000 Gs`);
assert(totals.subtotalNet === 1775000, `Subtotal neto: 1.775.000 Gs`);
assert(totals.ivaAmount === 177500, `IVA 10%: 177.500 Gs (actual: ${totals.ivaAmount})`);
assert(totals.totalSale === 1952500, `Total facturado: 1.952.500 Gs`);
assert(totals.hasUnpricedItems === false, `Todos los ítems tienen precio asignado`);

// 7. Numeración Correlativa Segura
console.log('\n--- 7. Numeración Correlativa Comercial ---');
const existingQuotes = [
  { budget_number: 'PRES-2026-0001' },
  { budget_number: 'PRES-2026-0008' },
  { budget_number: 'PRES-2026-0002' }
];
const nextQuoteNumber = PricingEngine.generateQuoteNumber(existingQuotes, 2026);
assert(nextQuoteNumber === 'PRES-2026-0009', `Siguiente presupuesto correlativo: PRES-2026-0009 (actual: ${nextQuoteNumber})`);

const nextProjCode = PricingEngine.generateProjectCode([{ code: 'PROY-2026-0004' }], 2026);
assert(nextProjCode === 'PROY-2026-0005', `Siguiente proyecto correlativo: PROY-2026-0005`);

console.log('======================================================================');
console.log(`📊 RESULTADO MOTOR DE CÁLCULO: ${passedTests} de ${totalTests} pruebas superadas.`);

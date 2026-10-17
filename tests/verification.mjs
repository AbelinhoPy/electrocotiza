// Test suite para verificar las reglas críticas de negocio de ElectroCotiza
import { matchScore, normalizeText, calculateTrigramSimilarity } from '../src/lib/fuzzy.ts';
import { numberToWordsPYG } from '../src/lib/number-to-words.ts';
import { formatPYG, isPriceStale } from '../src/lib/utils.ts';
import { INITIAL_PRODUCTS, INITIAL_INVOICES } from '../src/lib/data/initial-data.ts';

console.log('⚡ INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - ELECTROCOTIZA');
console.log('===========================================================');

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

// 1. Pruebas del Conversor de Números a Letras en Guaraníes
console.log('\n--- 1. Conversor de Montos a Palabras (Regla Legal Factura/Presupuesto) ---');
const n1 = numberToWordsPYG(1650000);
assert(n1.includes('UN MILLÓN') && n1.includes('SEISCIENTOS CINCUENTA MIL'), `1.650.000 Gs -> "${n1}"`);

const n2 = numberToWordsPYG(67100);
assert(n2.includes('SESENTA Y SIETE MIL CIEN'), `67.100 Gs -> "${n2}"`);

const n3 = numberToWordsPYG(3372704);
assert(n3.includes('TRES MILLONES') && n3.includes('SETECIENTOS CUATRO'), `3.372.704 Gs -> "${n3}"`);

const n4 = numberToWordsPYG(1500831);
assert(n4.includes('UN MILLÓN QUINIENTOS MIL') && n4.includes('TREINTA Y UN'), `1.500.831 Gs -> "${n4}"`);

// 2. Pruebas de Formato de Moneda Paraguaya (PYG)
console.log('\n--- 2. Formato de Moneda (Guaraníes sin decimales) ---');
const f1 = formatPYG(1250000);
assert(f1.startsWith('₲') && f1.includes('1.250.000'), `Formato 1.250.000 -> "${f1}"`);

const f2 = formatPYG(470);
assert(f2.includes('470'), `Formato 470 -> "${f2}"`);

// 3. Pruebas de Homologación con Facturas Reales de Paraguay
console.log('\n--- 3. Motor de Homologación con Facturas Reales ---');

// Factura Enerluz: BARRAM. COBRE 20X3MM
const raw1 = 'BARRAM. COBRE 20X3MM 3/4X1/8 (211A)';
const barraProduct = INITIAL_PRODUCTS.find(p => p.sku === 'BARRA-CU-20X3');
assert(barraProduct.aliases.includes(raw1), `El producto canónico tiene el alias exacto registrado de Enerluz`);

const score1 = matchScore(raw1, barraProduct.name);
assert(score1 >= 0.55, `Similitud semántica con nombre canónico: ${score1} >= 0.55`);

// Factura Fixopar: BULON SX MA 8.8 BC 10 X 25 RI
const raw2 = 'BULON SX MA 8.8 BC 10 X 25 RI';
const bulonProduct = INITIAL_PRODUCTS.find(p => p.sku === 'BULON-M10X25');
assert(bulonProduct.aliases.includes(raw2), `El bulón Fixopar tiene el alias exacto registrado`);

const score2 = matchScore(raw2, bulonProduct.name);
assert(score2 >= 0.50, `Similitud semántica con bulón canónico: ${score2} >= 0.50`);

// Factura Disyuntores ABB: A2 DISY TERM DIN 3P 020A 6KA SH203-ABB
const raw3 = 'A2 DISY TERM DIN 3P 020A 6KA SH203-ABB';
const abbProduct = INITIAL_PRODUCTS.find(p => p.sku === 'DISY-ABB-3P-20A');
assert(abbProduct.aliases.includes(raw3), `El disyuntor ABB tiene el alias exacto registrado`);

// 4. Integridad de las 9 Facturas Reales Cargadas
console.log('\n--- 4. Validación Matemática de las 9 Facturas Reales ---');
assert(INITIAL_INVOICES.length === 9, `Existen 9 facturas reales registradas en el sistema (actual: ${INITIAL_INVOICES.length})`);

for (const inv of INITIAL_INVOICES) {
  const sumLines = inv.items.reduce((acc, it) => acc + it.total_pyg, 0);
  // Las facturas tienen total declarado
  assert(
    Math.abs(sumLines - inv.total_pyg) <= 10,
    `Factura ${inv.provider_name} #${inv.invoice_number}: Suma líneas (${sumLines} Gs) == Total (${inv.total_pyg} Gs)`
  );
}

// 5. Detección de Precios Viejos (> 60 días)
console.log('\n--- 5. Detección de Precios Viejos (> 60 días) ---');
const recentDate = '2026-10-14';
const oldDate = '2026-06-15';
assert(!isPriceStale(recentDate, 60), `Precio reciente (14/10/2026) NO debe ser marcado como viejo`);
assert(isPriceStale(oldDate, 60), `Precio antiguo (15/06/2026) DEBE ser marcado como viejo (> 60 días)`);

console.log('===========================================================');
console.log(`📊 RESULTADO FINAL: ${passedTests} de ${totalTests} pruebas superadas con éxito.`);

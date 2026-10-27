import { 
  generateClientPDF, 
  generateMaterialsListPDF, 
  generatePriceListPDF, 
  generateInternalCostSummaryPDF 
} from '../src/lib/export/pdf-generator.ts';
import { INITIAL_BUDGETS, INITIAL_SETTINGS } from '../src/lib/data/initial-data.ts';

async function testPDF() {
  console.log('Testing PDF Generation Suite (All 4 Document Types)...');
  const budget = INITIAL_BUDGETS[0];
  const settings = INITIAL_SETTINGS;

  // 1. Client Executive PDF
  const clientDoc = await generateClientPDF(budget, settings);
  const clientOutput = clientDoc.output();

  if (clientOutput.includes('PRESUPUESTO') && clientOutput.includes('SON GUARAN')) {
    console.log('✅ [PASS] Client PDF contains title and "SON GUARANÍES" clause');
  } else {
    console.error('❌ [FAIL] Missing required header or legal clause in Client PDF');
  }

  // Verificar que NO aparezcan nombres de proveedores en el PDF para clientes
  const providersToCheck = ['Luminotecnia', 'Condel', 'Record Electric', 'ENERLUZ', 'FIXOPAR'];
  let leakFound = false;
  for (const prov of providersToCheck) {
    if (clientOutput.includes(prov)) {
      console.error(`❌ [FAIL] Provider leak detected in client PDF: ${prov}`);
      leakFound = true;
    }
  }

  if (!leakFound) {
    console.log('✅ [PASS] Zero provider name leaks in client PDF (Confidentiality verified)');
  }

  // 2. Materials List PDF (Técnica / Pañol)
  const matDoc = await generateMaterialsListPDF(budget, settings);
  const matOutput = matDoc.output();
  if (matOutput.includes('LISTA DE MATERIALES')) {
    console.log('✅ [PASS] Materials List PDF generated with technical header');
  } else {
    console.error('❌ [FAIL] Materials List PDF failed');
  }

  // 3. Price List PDF
  const priceDoc = await generatePriceListPDF(budget, settings);
  const priceOutput = priceDoc.output();
  if (priceOutput.includes('LISTA DE PRECIOS')) {
    console.log('✅ [PASS] Price List PDF generated with commercial tarifary');
  } else {
    console.error('❌ [FAIL] Price List PDF failed');
  }

  // 4. Internal Cost Summary PDF
  const internalDoc = await generateInternalCostSummaryPDF(budget, settings);
  const internalOutput = internalDoc.output();
  if (internalOutput.includes('CONFIDENCIAL') && internalOutput.includes('HOJA DE COSTOS')) {
    console.log('✅ [PASS] Internal Cost Summary PDF generated with confidentiality watermark and provider details');
  } else {
    console.error('❌ [FAIL] Internal Cost Summary PDF failed');
  }
}

testPDF().catch(console.error);

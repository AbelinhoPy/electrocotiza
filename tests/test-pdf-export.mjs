import { generateClientPDF } from '../src/lib/export/pdf-generator.ts';
import { INITIAL_BUDGETS, INITIAL_SETTINGS } from '../src/lib/data/initial-data.ts';

async function testPDF() {
  console.log('Testing Client PDF Generation...');
  const budget = INITIAL_BUDGETS[0];
  const settings = INITIAL_SETTINGS;

  const doc = await generateClientPDF(budget, settings);
  const pdfOutput = doc.output();

  // Verificaciones de confidencialidad y contenido
  if (pdfOutput.includes('PRESUPUESTO') && pdfOutput.includes('SON GUARAN')) {
    console.log('✅ [PASS] PDF contains title and "SON GUARANÍES" clause');
  } else {
    console.error('❌ [FAIL] Missing required header or legal clause');
  }

  // Verificar que NO aparezcan nombres de proveedores en el PDF para clientes
  const providersToCheck = ['Luminotecnia', 'Condel', 'Record Electric', 'ENERLUZ', 'FIXOPAR'];
  let leakFound = false;
  for (const prov of providersToCheck) {
    if (pdfOutput.includes(prov)) {
      console.error(`❌ [FAIL] Provider leak detected in client PDF: ${prov}`);
      leakFound = true;
    }
  }

  if (!leakFound) {
    console.log('✅ [PASS] Zero provider name leaks in client PDF (Confidentiality verified)');
  }
}

testPDF().catch(console.error);

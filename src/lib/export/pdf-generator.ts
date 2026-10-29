import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Budget, CompanySettings } from '../types';
import { formatDatePY, formatPYG } from '../utils';
import { numberToWordsPYG } from '../number-to-words';

const applyAutoTable = (doc: jsPDF, options: any) => {
  const autoTableFunc = (autoTable as any)?.default || autoTable || (doc as any).autoTable;
  autoTableFunc(doc, options);
};

/**
 * DOCUMENTO A: LISTA DE MATERIALES (TÉCNICA / PAÑOL / COMPRAS)
 * No muestra costos ni precios comerciales por defecto.
 */
export async function generateMaterialsListPDF(
  budget: Budget, 
  settings: CompanySettings, 
  options: { groupBySubgroup?: boolean } = { groupBySubgroup: true }
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Borde técnico
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Encabezado
  doc.setFillColor(30, 41, 59);
  doc.rect(margin + 1, margin + 1, pageWidth - (margin + 1) * 2, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('LISTA DE MATERIALES Y REQUERIMIENTO TÉCNICO', margin + 6, margin + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.company_name}  |  RUC: ${settings.ruc}`, margin + 6, margin + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`Doc Ref: ${budget.budget_number}`, pageWidth - margin - 6, margin + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDatePY(budget.created_at.split('T')[0])}`, pageWidth - margin - 6, margin + 15, { align: 'right' });

  // Datos del Proyecto y Destino
  let currentY = margin + 27;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 2, currentY, pageWidth - (margin + 2) * 2, 14, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PROYECTO: ${budget.title || budget.project_name || 'Instalación Eléctrica Industrial'}`, margin + 6, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`CLIENTE: ${budget.client.name} | Ubicación: ${budget.client.city || 'Asunción'}`, margin + 6, currentY + 10);

  currentY += 18;

  // Filas de materiales
  const tableRows: any[] = [];
  const items = budget.items.filter(i => !i.is_excluded_or_client_provided);

  items.forEach((item, index) => {
    tableRows.push([
      item.hierarchical_number || (index + 1).toString(),
      item.description,
      item.brand || 'Estándar',
      item.model || '-',
      item.quantity.toLocaleString('es-PY'),
      item.unit,
      item.notes || 'Normal'
    ]);
  });

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin + 2, right: margin + 2 },
    head: [['#', 'DESCRIPCIÓN DEL MATERIAL', 'MARCA', 'MODELO', 'CANT.', 'UNIDAD', 'OBSERVACIÓN']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 32, halign: 'left' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Documento operativo para preparación de pedidos, pañol y control de recepción en obra.', margin + 4, finalY);

  return doc;
}

/**
 * DOCUMENTO B: LISTA DE PRECIOS COMERCIAL
 */
export async function generatePriceListPDF(budget: Budget, settings: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Borde azul corporativo
  doc.setDrawColor(15, 33, 55);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Encabezado
  doc.setFillColor(15, 33, 55);
  doc.rect(margin + 1, margin + 1, pageWidth - (margin + 1) * 2, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(251, 191, 36);
  doc.text('LISTA DE PRECIOS Y TARIFARIO COMERCIAL', margin + 6, margin + 10);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.company_name}  |  RUC: ${settings.ruc}  |  Tel: ${settings.phone}`, margin + 6, margin + 17);

  doc.setFont('helvetica', 'bold');
  doc.text(`Ref: ${budget.budget_number}`, pageWidth - margin - 6, margin + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDatePY(budget.created_at.split('T')[0])}`, pageWidth - margin - 6, margin + 17, { align: 'right' });

  let currentY = margin + 30;

  const tableRows = budget.items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.unit,
    item.quantity.toLocaleString('es-PY'),
    formatPYG(item.unit_sale_pyg),
    formatPYG(item.total_sale_pyg),
  ]);

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin + 3, right: margin + 3 },
    head: [['#', 'CONCEPTO / MATERIAL', 'UNIDAD', 'CANTIDAD', 'PRECIO UNIT. (IVA INC.)', 'TOTAL']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 33, 55],
      textColor: [251, 191, 36],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 34, halign: 'right' },
      5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - margin - 70, finalY, 66, 12, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 33, 55);
  doc.text('TOTAL GENERAL:', pageWidth - margin - 65, finalY + 7);
  doc.text(formatPYG(budget.total_sale_pyg), pageWidth - margin - 6, finalY + 7, { align: 'right' });

  return doc;
}

/**
 * DOCUMENTO C: PRESUPUESTO COMERCIAL EJECUTIVO (OFICIAL PARA CLIENTES)
 * Estricta confidencialidad de proveedores y costos de compra.
 * Diseño de alta gama con marco dorado, IVA 10%, condiciones y datos SIPAP.
 */
export async function generateClientPDF(budget: Budget, settings: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // 1. MARCO DORADO ELEGANTE
  if (settings.pdf_gold_border) {
    doc.setDrawColor(212, 175, 55); // #D4AF37 Gold
    doc.setLineWidth(0.8);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    doc.setLineWidth(0.2);
    doc.rect(margin + 1.2, margin + 1.2, pageWidth - (margin + 1.2) * 2, pageHeight - (margin + 1.2) * 2);
  }

  // 2. ENCABEZADO CORPORATIVO
  doc.setFillColor(15, 33, 55);
  doc.rect(margin + 2, margin + 2, pageWidth - (margin + 2) * 2, 28, 'F');

  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.company_name, margin + 8, margin + 11);

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text(`RUC: ${settings.ruc}  |  Tel: ${settings.phone}`, margin + 8, margin + 17);
  doc.text(`${settings.address} - ${settings.email}`, margin + 8, margin + 23);

  // Título y Número con Revisión
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(251, 191, 36);
  doc.text('PRESUPUESTO', pageWidth - margin - 8, margin + 11, { align: 'right' });
  
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  const revText = budget.current_revision ? ` (Rev. ${budget.current_revision})` : '';
  doc.text(`Nº: ${budget.budget_number}${revText}`, pageWidth - margin - 8, margin + 17, { align: 'right' });
  doc.text(`Fecha: ${formatDatePY(budget.created_at.split('T')[0])}`, pageWidth - margin - 8, margin + 23, { align: 'right' });

  // 3. DATOS DEL CLIENTE ("PARA:")
  let currentY = margin + 35;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 4, currentY, pageWidth - (margin + 4) * 2, 24, 2, 2, 'FD');

  doc.setTextColor(15, 33, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENTE / EMPRESA:', margin + 8, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(budget.client.name, margin + 45, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`RUC / C.I.: ${budget.client.ruc_or_ci || 'Sin especificar'}`, margin + 8, currentY + 12);
  doc.text(`Teléfono: ${budget.client.phone || '-'}`, margin + 75, currentY + 12);
  doc.text(`Ciudad: ${budget.client.city || 'Asunción'}`, margin + 135, currentY + 12);
  doc.text(`Dirección: ${budget.client.address || 'En obra'}`, margin + 8, currentY + 17);
  doc.text(`Proyecto: ${budget.title || budget.project_name || 'Instalación Eléctrica'}`, margin + 8, currentY + 22);

  currentY += 28;

  // 4. TABLA PRINCIPAL DE ÍTEMS Y CONCEPTOS
  const tableRows: any[] = [];
  
  // A. Materiales
  budget.items.forEach((item, index) => {
    tableRows.push([
      item.hierarchical_number || (index + 1).toString(),
      item.description,
      item.unit,
      item.quantity.toLocaleString('es-PY'),
      formatPYG(item.unit_sale_pyg),
      formatPYG(item.total_sale_pyg),
    ]);
  });

  // B. Mano de obra si aplica
  if (budget.labor_lines && budget.labor_lines.length > 0) {
    budget.labor_lines
      .filter(l => l.is_included_in_quote && !l.covered_by_other_concept)
      .forEach(l => {
        tableRows.push([
          'MO',
          l.service_description || 'Mano de Obra Especializada',
          l.method === 'man_hours' ? 'HH' : 'SERV',
          l.method === 'man_hours' ? `${(l.hours_per_worker || 0) * (l.worker_count || 1)}h` : '1',
          formatPYG(l.total_pyg),
          formatPYG(l.total_pyg)
        ]);
      });
  }

  // C. Logística si aplica
  if (budget.logistics_lines && budget.logistics_lines.length > 0) {
    budget.logistics_lines
      .filter(l => l.is_included_in_quote)
      .forEach(l => {
        tableRows.push([
          'LOG',
          l.description,
          l.unit || 'GLB',
          l.quantity?.toString() || '1',
          formatPYG(l.sale_price_pyg),
          formatPYG(l.sale_price_pyg)
        ]);
      });
  }

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin + 4, right: margin + 4 },
    head: [['#', 'DESCRIPCIÓN DE MATERIALES, TRABAJOS Y SERVICIOS', 'UNIDAD', 'CANT.', 'PRECIO UNIT. (NETO)', 'IMPORTE (NETO)']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 33, 55],
      textColor: [251, 191, 36],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // 5. RESUMEN FINANCIERO Y MONTO EN PALABRAS
  const totalLetras = numberToWordsPYG(budget.total_sale_pyg);

  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 4, finalY, pageWidth - (margin + 4) * 2, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 33, 55);
  doc.text('SON GUARANÍES (IVA 10% INCLUIDO):', margin + 8, finalY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text(totalLetras, margin + 8, finalY + 10.5, { maxWidth: pageWidth - margin * 2 - 70 });

  // Desglose Subtotal Neto, IVA 10% y Total
  const subtotalNeto = budget.subtotal_net_pyg || (budget.total_sale_pyg - (budget.iva_amount_pyg || 0));
  const ivaCalculado = budget.iva_amount_pyg || Math.round(subtotalNeto * 0.10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Neto:', pageWidth - margin - 58, finalY + 6);
  doc.text(formatPYG(subtotalNeto), pageWidth - margin - 8, finalY + 6, { align: 'right' });

  doc.text('IVA 10%:', pageWidth - margin - 58, finalY + 11);
  doc.text(formatPYG(ivaCalculado), pageWidth - margin - 8, finalY + 11, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 33, 55);
  doc.text('TOTAL PRESUPUESTO:', pageWidth - margin - 58, finalY + 17);
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  doc.text(formatPYG(budget.total_sale_pyg), pageWidth - margin - 8, finalY + 23, { align: 'right' });

  // 6. CONDICIONES COMERCIALES Y DATOS BANCARIOS SIPAP
  const condY = finalY + 31;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 33, 55);
  doc.text('CONDICIONES COMERCIALES Y DE SERVICIO:', margin + 8, condY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Plazo de Entrega: ${budget.delivery_terms || settings.pdf_plazo_entrega_defecto}`, margin + 8, condY + 4.5);
  doc.text(`• Forma de Pago: ${budget.payment_terms || settings.pdf_condicion_pago_defecto}`, margin + 8, condY + 9);
  doc.text(`• Validez de la Oferta: ${budget.validity_days || settings.pdf_validez_dias} días corridos.`, margin + 8, condY + 13.5);

  if (settings.bank_sipap_alias || settings.bank_account_number) {
    doc.setFont('helvetica', 'bold');
    doc.text(`• Transferencia SIPAP: ${settings.bank_name} | Alias: ${settings.bank_sipap_alias || 'construlogica.py'} | Cta: ${settings.bank_account_number}`, margin + 8, condY + 18);
  }

  // 7. BLOQUES DE FIRMA (EMISOR Y CONFORME CLIENTE)
  const signY = pageHeight - margin - 22;

  // Firma Emisor
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(margin + 15, signY, margin + 75, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 33, 55);
  doc.text(settings.company_name, margin + 45, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Firma y Aclaración Técnica', margin + 45, signY + 8, { align: 'center' });

  // Firma Conforme Cliente
  doc.line(pageWidth - margin - 75, signY, pageWidth - margin - 15, signY);
  doc.setFont('helvetica', 'bold');
  doc.text('Aceptación Conforme del Cliente', pageWidth - margin - 45, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Firma, Sello y Fecha', pageWidth - margin - 45, signY + 8, { align: 'center' });

  // Pie de página confidencial
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.pdf_pie_texto, pageWidth / 2, pageHeight - margin - 4, { align: 'center' });

  return doc;
}

/**
 * DOCUMENTO D: RESUMEN INTERNO DE COSTOS Y RENTABILIDAD
 * Acceso estrictamente restringido a Administradores y Presupuestistas autorizados.
 */
export async function generateInternalCostSummaryPDF(budget: Budget, settings: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Marca de agua de Confidencialidad
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('USO INTERNO EXCLUSIVO', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
  });

  // Borde rojo/ámbar confidencial
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Encabezado
  doc.setFillColor(220, 38, 38);
  doc.rect(margin + 1, margin + 1, pageWidth - (margin + 1) * 2, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('HOJA DE COSTOS, PROVEEDORES Y RENTABILIDAD', margin + 6, margin + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENCIAL • PROHIBIDA SU DISTRIBUCIÓN EXTERNA', margin + 6, margin + 14);

  doc.setFont('helvetica', 'bold');
  doc.text(`Presupuesto: ${budget.budget_number}`, pageWidth - margin - 6, margin + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${budget.client.name}`, pageWidth - margin - 6, margin + 14, { align: 'right' });

  let currentY = margin + 26;

  // Tabla con detalles de compra y márgenes
  const tableRows = budget.items.map((item, index) => {
    const qty = item.quantity || 1;
    const costUnit = item.unit_cost_pyg || 0;
    const costTotal = costUnit * qty;
    const saleTotal = item.total_sale_pyg || 0;
    const profit = saleTotal - costTotal;
    const marginPct = saleTotal > 0 ? ((profit / saleTotal) * 100).toFixed(1) : '0';

    return [
      (index + 1).toString(),
      item.description,
      item.provider_name || 'Sin proveedor',
      formatPYG(costUnit),
      formatPYG(costTotal),
      formatPYG(saleTotal),
      `${marginPct}%`,
      formatPYG(profit),
    ];
  });

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin + 2, right: margin + 2 },
    head: [['#', 'MATERIAL / ÍTEM', 'PROVEEDOR', 'COSTO UNIT.', 'COSTO TOT.', 'VENTA TOT.', 'MARGEN', 'UTILIDAD']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [15, 23, 42],
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 26, halign: 'left' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Resumen de Rentabilidad Global
  const totalCost = budget.total_cost_pyg || budget.items.reduce((acc, i) => acc + (i.unit_cost_pyg * i.quantity), 0);
  const totalSale = budget.total_sale_pyg || 0;
  const netProfit = totalSale - totalCost;
  const globalMarginPct = totalSale > 0 ? ((netProfit / totalSale) * 100).toFixed(2) : '0';

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - margin - 90, finalY, 86, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Costo Total de Compra:', pageWidth - margin - 86, finalY + 6);
  doc.text(formatPYG(totalCost), pageWidth - margin - 8, finalY + 6, { align: 'right' });

  doc.text('Total Venta Comercial:', pageWidth - margin - 86, finalY + 12);
  doc.text(formatPYG(totalSale), pageWidth - margin - 8, finalY + 12, { align: 'right' });

  doc.setTextColor(22, 101, 52); // Verde ganancia
  doc.text('Margen de Rentabilidad Global:', pageWidth - margin - 86, finalY + 18);
  doc.text(`${globalMarginPct}%`, pageWidth - margin - 8, finalY + 18, { align: 'right' });

  doc.setFontSize(9);
  doc.text('Utilidad Bruta Estimada:', pageWidth - margin - 86, finalY + 24);
  doc.text(formatPYG(netProfit), pageWidth - margin - 8, finalY + 24, { align: 'right' });

  return doc;
}

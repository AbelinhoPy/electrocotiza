import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Budget, Settings } from '../types.ts';
import { formatDatePY, formatPYG } from '../utils.ts';
import { numberToWordsPYG } from '../number-to-words.ts';

export async function generateClientPDF(budget: Budget, settings: Settings): Promise<jsPDF> {
  // A4: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // 1. MARCO DORADO ELEGANTE (Si está activado)
  if (settings.pdf_gold_border) {
    // Borde exterior fino dorado
    doc.setDrawColor(212, 175, 55); // #D4AF37 Gold
    doc.setLineWidth(0.8);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    // Borde interior sutil
    doc.setLineWidth(0.2);
    doc.rect(margin + 1.2, margin + 1.2, pageWidth - (margin + 1.2) * 2, pageHeight - (margin + 1.2) * 2);
  }

  // 2. ENCABEZADO: LOGO Y DATOS DE LA EMPRESA
  // Encabezado con fondo azul corporativo (#0F2137)
  doc.setFillColor(15, 33, 55);
  doc.rect(margin + 2, margin + 2, pageWidth - (margin + 2) * 2, 28, 'F');

  // Intentar cargar logo o texto institucional
  doc.setTextColor(251, 191, 36); // Amarillo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.company_name, margin + 8, margin + 12);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text(`RUC: ${settings.ruc}  |  Tel: ${settings.phone}`, margin + 8, margin + 18);
  doc.text(`${settings.address} - ${settings.email}`, margin + 8, margin + 24);

  // Título de Cotización a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(251, 191, 36);
  doc.text('PRESUPUESTO', pageWidth - margin - 8, margin + 12, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Nº: ${budget.budget_number}`, pageWidth - margin - 8, margin + 18, { align: 'right' });
  doc.text(`Fecha: ${formatDatePY(budget.created_at.split('T')[0])}`, pageWidth - margin - 8, margin + 24, { align: 'right' });

  // 3. DATOS DEL CLIENTE ("PARA:")
  let currentY = margin + 35;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 4, currentY, pageWidth - (margin + 4) * 2, 24, 2, 2, 'FD');

  doc.setTextColor(15, 33, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PARA:', margin + 8, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(budget.client.name, margin + 22, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`RUC / C.I.: ${budget.client.ruc_or_ci || 'Sin especificar'}`, margin + 8, currentY + 12);
  doc.text(`Teléfono: ${budget.client.phone || '-'}`, margin + 70, currentY + 12);
  doc.text(`Ciudad: ${budget.client.city || 'Asunción'}`, margin + 130, currentY + 12);
  doc.text(`Dirección: ${budget.client.address || 'En obra'}`, margin + 8, currentY + 18);
  doc.text(`Proyecto: ${budget.title}`, margin + 8, currentY + 22);

  currentY += 28;

  // 4. TABLA DE ÍTEMS (ESTRICTAMENTE SIN COSTOS NI PROVEEDORES)
  const tableRows = budget.items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.unit,
    item.quantity.toLocaleString('es-PY'),
    formatPYG(item.unit_sale_pyg),
    formatPYG(item.total_sale_pyg),
  ]);

  const applyAutoTable = (autoTable as any)?.default || autoTable || (doc as any).autoTable;
  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin + 4, right: margin + 4 },
    head: [['#', 'DESCRIPCIÓN DE MATERIALES Y TRABAJOS', 'UNIDAD', 'CANT.', 'PRECIO UNIT. (IVA INC.)', 'TOTAL']],
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
      0: { cellWidth: 8, halign: 'center' },
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // 5. RESUMEN Y VALOR EN LETRAS OBLIGATORIO
  const totalLetras = numberToWordsPYG(budget.total_sale_pyg);

  doc.setFillColor(254, 243, 199); // Fondo ámbar claro
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 4, finalY, pageWidth - (margin + 4) * 2, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 33, 55);
  doc.text('SON GUARANÍES (IVA 10% INCLUIDO EN EL VALOR):', margin + 8, finalY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9); // Ámbar oscuro
  doc.text(totalLetras, margin + 8, finalY + 12);

  // Cuadro del Total a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 33, 55);
  doc.text('TOTAL GENERAL:', pageWidth - margin - 55, finalY + 8);

  doc.setFontSize(14);
  doc.setTextColor(15, 33, 55);
  doc.text(formatPYG(budget.total_sale_pyg), pageWidth - margin - 8, finalY + 16, { align: 'right' });

  // 6. CONDICIONES COMERCIALES Y VALIDEZ
  const condY = finalY + 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 33, 55);
  doc.text('CONDICIONES GENERALES:', margin + 8, condY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.text(`• Plazo de Entrega: ${budget.delivery_terms || settings.pdf_plazo_entrega_defecto}`, margin + 8, condY + 5);
  doc.text(`• Forma de Pago: ${budget.payment_terms || settings.pdf_condicion_pago_defecto}`, margin + 8, condY + 10);
  doc.text(`• Validez de la Oferta: ${budget.validity_days || settings.pdf_validez_dias} días corridos a partir de la fecha de emisión.`, margin + 8, condY + 15);
  if (budget.notes) {
    doc.text(`• Observaciones: ${budget.notes}`, margin + 8, condY + 20);
  }

  // 7. FIRMA Y PIE CONFIDENCIAL
  const signY = pageHeight - margin - 22;

  // Línea de firma
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 60, signY, pageWidth - margin - 8, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 33, 55);
  doc.text(settings.company_name, pageWidth - margin - 34, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma Autorizada', pageWidth - margin - 34, signY + 8, { align: 'center' });

  // Pie de página confidencial
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.pdf_pie_texto, pageWidth / 2, pageHeight - margin - 4, { align: 'center' });

  return doc;
}

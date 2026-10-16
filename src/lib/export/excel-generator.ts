import * as XLSX from 'xlsx';
import { Budget } from '../types';

export function generateInternalExcel(budget: Budget): void {
  // Filas para la hoja de cálculo interna
  const rows: Record<string, string | number>[] = budget.items.map((it, idx) => {
    const totalCost = it.unit_cost_pyg * it.quantity;
    const totalSale = it.total_sale_pyg;
    const profit = totalSale - totalCost;

    return {
      '#': idx + 1,
      'Tipo': it.item_type === 'material' ? 'Material' : 'Mano de Obra',
      'Descripción': it.description,
      'Unidad': it.unit,
      'Cantidad': it.quantity,
      'Proveedor de Referencia': it.provider_name || 'Stock / Directo',
      'Costo Unitario (PYG)': it.unit_cost_pyg,
      'Costo Total (PYG)': totalCost,
      'Margen (%)': it.margin_pct,
      'Precio Venta Unitario (PYG)': it.unit_sale_pyg,
      'Precio Venta Total (PYG)': totalSale,
      'Ganancia Bruta Estimada (PYG)': profit,
    };
  });

  // Fila de resumen total
  const totalCostAll = budget.items.reduce((acc, it) => acc + (it.unit_cost_pyg * it.quantity), 0);
  const totalSaleAll = budget.total_sale_pyg;
  const totalProfit = totalSaleAll - totalCostAll;

  rows.push({
    '#': 'TOTAL',
    'Tipo': '',
    'Descripción': 'RESUMEN GENERAL DEL PRESUPUESTO',
    'Unidad': '',
    'Cantidad': '',
    'Proveedor de Referencia': '',
    'Costo Unitario (PYG)': '',
    'Costo Total (PYG)': totalCostAll,
    'Margen (%)': `${budget.global_margin_pct}% Promedio`,
    'Precio Venta Unitario (PYG)': '',
    'Precio Venta Total (PYG)': totalSaleAll,
    'Ganancia Bruta Estimada (PYG)': totalProfit,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Anchos de columna optimizados
  worksheet['!cols'] = [
    { wch: 6 },  // #
    { wch: 14 }, // Tipo
    { wch: 45 }, // Descripción
    { wch: 8 },  // Unidad
    { wch: 10 }, // Cantidad
    { wch: 28 }, // Proveedor
    { wch: 18 }, // Costo Unitario
    { wch: 18 }, // Costo Total
    { wch: 12 }, // Margen %
    { wch: 22 }, // Precio Venta Unitario
    { wch: 22 }, // Precio Venta Total
    { wch: 25 }, // Ganancia
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoría Interna');

  // Descarga directa en el navegador
  XLSX.writeFile(workbook, `Presupuesto_Interno_${budget.budget_number}.xlsx`);
}

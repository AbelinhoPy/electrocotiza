/**
 * Motor Centralizado de Cálculos Comerciales y Reglas de Negocio
 * Aplica con estricta precisión matemática las reglas comerciales de Paraguay:
 * - Margen sobre venta vs Recargo sobre costo
 * - Descuentos comerciales y umbral de autorización (20%)
 * - Bloqueo preventivo de venta bajo costo
 * - IVA 10% y normalización de precios de compra
 * - Mano de obra (horas-hombre y servicios)
 * - Gastos logísticos (movilidad, viáticos, alojamiento, fletes)
 */

import { 
  BudgetItem, 
  LaborLine, 
  LogisticsLine, 
  Quote, 
  QuotePriceSnapshot 
} from './types';

export interface DiscountValidationResult {
  allowed: boolean;
  requiresApproval: boolean;
  belowCost: boolean;
  finalPrice: number;
  salePriceBeforeDiscount: number;
  marginRealPct: number;
  message: string;
}

export interface QuoteTotalsCalculation {
  totalMaterialsCost: number;
  totalMaterialsSale: number;
  totalLaborCost: number;
  totalLaborSale: number;
  totalLogisticsCost: number;
  totalLogisticsSale: number;
  totalOtherSale: number;
  totalDiscountAmount: number;
  subtotalNet: number;
  ivaAmount: number;
  totalSale: number;
  totalCost: number;
  estimatedProfit: number;
  profitMarginPct: number;
  hasUnpricedItems: boolean;
  unpricedItemsCount: number;
}

export const PricingEngine = {
  /**
   * Redondeo centralizado para evitar errores de precisión decimal
   * En Guaraníes (PYG) no existen centavos: se redondea al entero más próximo
   * En USD se redondea a 2 decimales
   */
  round(amount: number, currency: 'PYG' | 'USD' = 'PYG'): number {
    if (isNaN(amount) || !isFinite(amount)) return 0;
    if (currency === 'USD') {
      return Math.round((amount + Number.EPSILON) * 100) / 100;
    }
    return Math.round(amount);
  },

  /**
   * Normaliza el precio de compra si incluye IVA
   * En Paraguay, el IVA crédito fiscal es deducible y no constituye costo comercial
   */
  normalizePurchaseCost(grossPrice: number, includesIva: boolean, ivaRatePct: number = 10): number {
    if (!includesIva || ivaRatePct <= 0) return this.round(grossPrice);
    const divisor = 1 + (ivaRatePct / 100);
    return this.round(grossPrice / divisor);
  },

  /**
   * Margen sobre venta:
   * Precio de venta = Costo / (1 - Margen)
   * Ejemplo: Costo 60.000 con 40% margen => 60.000 / (1 - 0.40) = 100.000
   */
  calculateSalePriceFromMargin(cost: number, marginPct: number, currency: 'PYG' | 'USD' = 'PYG'): number {
    if (cost <= 0) return 0;
    if (marginPct >= 100) marginPct = 99.9; // Prevenir división por cero o negativo
    const factor = 1 - (marginPct / 100);
    return this.round(cost / factor, currency);
  },

  /**
   * Recargo sobre costo (Markup):
   * Precio de venta = Costo * (1 + Recargo)
   * Ejemplo: Costo 60.000 con 40% recargo => 60.000 * 1.40 = 84.000
   */
  calculateSalePriceFromMarkup(cost: number, markupPct: number, currency: 'PYG' | 'USD' = 'PYG'): number {
    if (cost <= 0) return 0;
    const factor = 1 + (markupPct / 100);
    return this.round(cost * factor, currency);
  },

  /**
   * Calcula el precio de venta según el método configurado (por defecto: margen sobre venta)
   */
  calculateUnitSaleBeforeDiscount(
    cost: number, 
    marginPct: number, 
    method: 'margin' | 'markup' = 'margin',
    currency: 'PYG' | 'USD' = 'PYG'
  ): number {
    return method === 'markup'
      ? this.calculateSalePriceFromMarkup(cost, marginPct, currency)
      : this.calculateSalePriceFromMargin(cost, marginPct, currency);
  },

  /**
   * Aplica descuento porcentual sobre el precio de lista
   * Precio final = Precio antes del descuento * (1 - descuento)
   */
  calculateFinalPrice(priceBeforeDiscount: number, discountPct: number, currency: 'PYG' | 'USD' = 'PYG'): number {
    if (discountPct <= 0) return this.round(priceBeforeDiscount, currency);
    const factor = Math.max(0, 1 - (discountPct / 100));
    return this.round(priceBeforeDiscount * factor, currency);
  },

  /**
   * Valida un descuento propuesto según políticas comerciales:
   * 1. Límite sin autorización (ej. 20%)
   * 2. Bloqueo estricto de venta bajo costo normalizado
   */
  validateDiscount(
    normalizedCost: number,
    salePriceBeforeDiscount: number,
    discountPct: number,
    maxUnapprovedDiscountPct: number = 20,
    currency: 'PYG' | 'USD' = 'PYG'
  ): DiscountValidationResult {
    const finalPrice = this.calculateFinalPrice(salePriceBeforeDiscount, discountPct, currency);
    const belowCost = finalPrice < normalizedCost;
    const requiresApproval = discountPct > maxUnapprovedDiscountPct;
    
    // Margen real efectivo obtenido
    const marginRealPct = finalPrice > 0 
      ? Number((((finalPrice - normalizedCost) / finalPrice) * 100).toFixed(2))
      : 0;

    let message = 'Descuento autorizado.';
    let allowed = true;

    if (belowCost) {
      allowed = false;
      message = `Bloqueo de seguridad: El precio final (${finalPrice}) queda por debajo del costo (${normalizedCost}). No se permite venta a pérdida.`;
    } else if (requiresApproval) {
      message = `El descuento del ${discountPct}% supera el límite del ${maxUnapprovedDiscountPct}% y requiere autorización de un Administrador.`;
    }

    return {
      allowed,
      requiresApproval,
      belowCost,
      finalPrice,
      salePriceBeforeDiscount,
      marginRealPct,
      message,
    };
  },

  /**
   * Crea un snapshot inmutable para un ítem del presupuesto
   */
  createPriceSnapshot(
    unitCost: number,
    marginPct: number,
    discountPct: number = 0,
    method: 'margin' | 'markup' = 'margin',
    currency: 'PYG' | 'USD' = 'PYG',
    exchangeRate: number = 7950,
    providerId?: string,
    providerName?: string,
    originDescription?: string,
    isExcludedOrClientProvided: boolean = false
  ): QuotePriceSnapshot {
    if (isExcludedOrClientProvided) {
      return {
        unit_cost_pyg: 0,
        currency,
        exchange_rate: exchangeRate,
        provider_id: providerId,
        provider_name: 'Suministrado por Cliente / Excluido',
        origin_description: originDescription,
        price_date: new Date().toISOString().split('T')[0],
        pricing_method: method,
        margin_pct: 0,
        sale_price_before_discount: 0,
        discount_pct: 0,
        final_unit_price: 0,
        iva_rate_pct: 0,
        is_excluded_or_client_provided: true,
      };
    }

    const saleBeforeDiscount = this.calculateUnitSaleBeforeDiscount(unitCost, marginPct, method, currency);
    const finalUnitPrice = this.calculateFinalPrice(saleBeforeDiscount, discountPct, currency);

    return {
      unit_cost_pyg: unitCost,
      currency,
      exchange_rate: exchangeRate,
      provider_id: providerId,
      provider_name: providerName,
      origin_description: originDescription,
      price_date: new Date().toISOString().split('T')[0],
      pricing_method: method,
      margin_pct: marginPct,
      sale_price_before_discount: saleBeforeDiscount,
      discount_pct: discountPct,
      final_unit_price: finalUnitPrice,
      iva_rate_pct: 10,
      is_excluded_or_client_provided: false,
    };
  },

  /**
   * Cálculo de Mano de Obra:
   * A. Horas hombre = Tarifa * horas por trabajador * cantidad de trabajadores
   * B. Servicio = Tarifa * cantidad
   */
  calculateLaborTotal(line: LaborLine, currency: 'PYG' | 'USD' = 'PYG'): number {
    if (line.covered_by_other_concept || !line.is_included_in_quote) {
      return 0;
    }

    if (line.method === 'man_hours') {
      const rate = line.hourly_rate_pyg || 0;
      const hours = line.hours_per_worker || 0;
      const workers = line.worker_count || 1;
      return this.round(rate * hours * workers, currency);
    } else {
      const rate = line.service_rate_pyg || 0;
      const qty = line.quantity || 1;
      return this.round(rate * qty, currency);
    }
  },

  /**
   * Cálculo de Gastos Logísticos:
   * - Movilidad = kilómetros * tarifa/km
   * - Viáticos = personas * días * tarifa diaria
   * - Alojamiento = personas * noches * tarifa por noche
   * - Fijo / Flete = cantidad * tarifa
   */
  calculateLogisticsTotal(line: LogisticsLine, currency: 'PYG' | 'USD' = 'PYG'): { cost: number; sale: number } {
    if (!line.is_included_in_quote) {
      return { cost: 0, sale: 0 };
    }

    let baseCost = 0;
    const rate = line.unit_rate_pyg || 0;

    switch (line.concept_type) {
      case 'km_mobility':
        baseCost = (line.quantity || 0) * rate;
        break;
      case 'daily_per_diem':
        baseCost = (line.people_count || 1) * (line.days_or_nights || 1) * rate;
        break;
      case 'daily_lodging':
        baseCost = (line.people_count || 1) * (line.days_or_nights || 1) * rate;
        break;
      case 'freight':
      case 'equipment_rental':
      case 'fixed_transfer':
      case 'other':
      default:
        baseCost = (line.quantity || 1) * rate;
        break;
    }

    const roundedCost = this.round(baseCost, currency);
    const salePrice = line.sale_price_pyg && line.sale_price_pyg > 0
      ? this.round(line.sale_price_pyg, currency)
      : this.calculateSalePriceFromMargin(roundedCost, line.margin_pct || 0, currency);

    return {
      cost: roundedCost,
      sale: salePrice,
    };
  },

  /**
   * Cálculo Completo de Totales del Presupuesto
   * Integra materiales, mano de obra, logística y calcula Subtotal Neto, IVA 10% y Total
   */
  calculateQuoteTotals(quote: Partial<Quote>, defaultIvaRatePct: number = 10): QuoteTotalsCalculation {
    const currency = quote.currency || 'PYG';
    const items = quote.items || [];
    const laborLines = quote.labor_lines || [];
    const logisticsLines = quote.logistics_lines || [];

    let totalMaterialsCost = 0;
    let totalMaterialsSale = 0;
    let totalDiscountAmount = 0;
    let unpricedItemsCount = 0;

    // 1. Materiales
    for (const item of items) {
      if (item.is_excluded_or_client_provided) {
        continue;
      }

      if (item.unit_cost_pyg === 0 && (!item.unit_sale_pyg || item.unit_sale_pyg === 0)) {
        unpricedItemsCount++;
      }

      const qty = item.quantity || 1;
      const unitCost = item.unit_cost_pyg || 0;
      const itemCost = unitCost * qty;
      totalMaterialsCost += itemCost;

      // Precio de venta
      let unitSale = item.unit_sale_pyg || 0;
      if (unitSale === 0 && unitCost > 0) {
        const margin = item.margin_pct ?? quote.global_margin_pct ?? 30;
        const beforeDisc = this.calculateUnitSaleBeforeDiscount(unitCost, margin, quote.pricing_method || 'margin', currency);
        unitSale = this.calculateFinalPrice(beforeDisc, item.discount_pct || 0, currency);
      }

      const itemSale = unitSale * qty;
      totalMaterialsSale += itemSale;

      // Calcular descuento si hubo
      if (item.discount_pct && item.discount_pct > 0) {
        const beforeDisc = this.calculateUnitSaleBeforeDiscount(unitCost, item.margin_pct ?? 30, quote.pricing_method || 'margin', currency);
        const discUnit = beforeDisc - unitSale;
        totalDiscountAmount += discUnit * qty;
      }
    }

    // 2. Mano de Obra
    let totalLaborCost = 0;
    let totalLaborSale = 0;
    for (const line of laborLines) {
      if (!line.is_included_in_quote || line.covered_by_other_concept) continue;
      const total = this.calculateLaborTotal(line, currency);
      totalLaborSale += total;
      // Estimación de costo directo de mano de obra (aprox 70% de la tarifa o igual a la tarifa base)
      totalLaborCost += this.round(total * 0.7, currency);
    }

    // 3. Logística
    let totalLogisticsCost = 0;
    let totalLogisticsSale = 0;
    for (const line of logisticsLines) {
      if (!line.is_included_in_quote) continue;
      const { cost, sale } = this.calculateLogisticsTotal(line, currency);
      totalLogisticsCost += cost;
      totalLogisticsSale += sale;
    }

    // 4. Subtotal Neto (Base Imponible)
    const subtotalNet = this.round(totalMaterialsSale + totalLaborSale + totalLogisticsSale, currency);

    // 5. IVA (10% paraguayo)
    const ivaAmount = this.round(subtotalNet * (defaultIvaRatePct / 100), currency);

    // 6. Total Facturado
    const totalSale = subtotalNet + ivaAmount;

    // 7. Costos y Rentabilidad
    const totalCost = this.round(totalMaterialsCost + totalLaborCost + totalLogisticsCost, currency);
    const estimatedProfit = subtotalNet - totalCost;
    const profitMarginPct = subtotalNet > 0
      ? Number(((estimatedProfit / subtotalNet) * 100).toFixed(2))
      : 0;

    return {
      totalMaterialsCost: this.round(totalMaterialsCost, currency),
      totalMaterialsSale: this.round(totalMaterialsSale, currency),
      totalLaborCost: this.round(totalLaborCost, currency),
      totalLaborSale: this.round(totalLaborSale, currency),
      totalLogisticsCost: this.round(totalLogisticsCost, currency),
      totalLogisticsSale: this.round(totalLogisticsSale, currency),
      totalOtherSale: 0,
      totalDiscountAmount: this.round(totalDiscountAmount, currency),
      subtotalNet,
      ivaAmount,
      totalSale,
      totalCost,
      estimatedProfit,
      profitMarginPct,
      hasUnpricedItems: unpricedItemsCount > 0,
      unpricedItemsCount,
    };
  },

  /**
   * Generación concurrente y segura del número comercial correlativo:
   * Formato: PRES-AAAA-NNNN (ej. PRES-2026-0001)
   */
  generateQuoteNumber(existingQuotes: { budget_number: string }[], year: number = new Date().getFullYear()): string {
    const prefix = `PRES-${year}-`;
    let maxNumber = 0;

    for (const q of existingQuotes) {
      if (q.budget_number && q.budget_number.startsWith(prefix)) {
        const numPart = parseInt(q.budget_number.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  },

  /**
   * Generación de código correlativo de Proyecto:
   * Formato: PROY-AAAA-NNNN (ej. PROY-2026-0001)
   */
  generateProjectCode(existingProjects: { code: string }[], year: number = new Date().getFullYear()): string {
    const prefix = `PROY-${year}-`;
    let maxNumber = 0;

    for (const p of existingProjects) {
      if (p.code && p.code.startsWith(prefix)) {
        const numPart = parseInt(p.code.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  },

  /**
   * Generación de código correlativo de Orden de Servicio:
   * Formato: OS-AAAA-NNNN (ej. OS-2026-0001)
   */
  generateServiceOrderNumber(existingOrders: { order_number: string }[], year: number = new Date().getFullYear()): string {
    const prefix = `OS-${year}-`;
    let maxNumber = 0;

    for (const o of existingOrders) {
      if (o.order_number && o.order_number.startsWith(prefix)) {
        const numPart = parseInt(o.order_number.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }
};

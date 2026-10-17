import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un monto en Guaraníes Paraguayos (PYG, sin decimales)
 * Ej: 1250000 -> "₲ 1.250.000"
 */
export function formatPYG(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₲ 0';
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
  return `₲ ${formatted}`;
}

/**
 * Formatea una fecha ISO a formato local paraguayo (DD/MM/AAAA)
 */
export function formatDatePY(dateString: string): string {
  if (!dateString) return '-';
  try {
    const clean = dateString.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calcula si un precio es antiguo (por defecto supera los 60 días)
 */
export function isPriceStale(dateString: string, staleThresholdDays = 60): boolean {
  if (!dateString) return true;
  try {
    const itemDate = new Date(dateString).getTime();
    // Referencia fija del entorno actual o Date.now()
    const now = new Date('2026-10-16').getTime();
    const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
    return diffDays > staleThresholdDays;
  } catch {
    return false;
  }
}

/**
 * Días transcurridos desde una fecha
 */
export function daysSince(dateString: string): number {
  if (!dateString) return 999;
  try {
    const itemDate = new Date(dateString).getTime();
    const now = new Date('2026-10-16').getTime();
    return Math.max(0, Math.floor((now - itemDate) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

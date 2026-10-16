/**
 * Convierte un valor entero en Guaraníes a su representación en letras en español.
 * Ej: 1650000 -> "UN MILLÓN SEISCIENTOS CINCUENTA MIL"
 */

const UNIDADES: string[] = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
];

const DECENAS_10: string[] = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
];

const DECENAS: string[] = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];

const CENTENAS: string[] = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function convertirCentenas(num: number): string {
  if (num === 0) return '';
  if (num === 100) return 'CIEN';

  const c = Math.floor(num / 100);
  const d = Math.floor((num % 100) / 10);
  const u = num % 10;

  let result = CENTENAS[c];

  if (d === 1) {
    result += (result ? ' ' : '') + DECENAS_10[u];
  } else if (d === 2 && u > 0) {
    const VEINTES = [
      '',
      'VEINTIÚN',
      'VEINTIDÓS',
      'VEINTITRÉS',
      'VEINTICUATRO',
      'VEINTICINCO',
      'VEINTISÉIS',
      'VEINTISIETE',
      'VEINTIOCHO',
      'VEINTINUEVE',
    ];
    result += (result ? ' ' : '') + VEINTES[u];
  } else if (d > 0) {
    result += (result ? ' ' : '') + DECENAS[d];
    if (u > 0) {
      result += ' Y ' + UNIDADES[u];
    }
  } else if (u > 0) {
    result += (result ? ' ' : '') + UNIDADES[u];
  }

  return result.trim();
}

export function numberToWordsPYG(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return 'CERO';

  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      partes.push('UN MILLÓN');
    } else {
      partes.push(`${convertirCentenas(millones)} MILLONES`);
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      partes.push('MIL');
    } else {
      partes.push(`${convertirCentenas(miles)} MIL`);
    }
  }

  if (resto > 0) {
    partes.push(convertirCentenas(resto));
  }

  return partes.join(' ').trim();
}

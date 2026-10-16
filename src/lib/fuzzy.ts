/**
 * Motor de Búsqueda Difusa y Homologación de Productos
 * Optimizado para Nomenclatura Eléctrica y Ferretera de Paraguay
 */

const COMMON_ABBREVIATIONS: Record<string, string> = {
  'barram': 'barra',
  'barram.': 'barra',
  'cond': 'cable conductor',
  'cond.': 'cable conductor',
  'cu': 'cobre',
  'disy': 'disyuntor',
  'disy.': 'disyuntor',
  'term': 'termomagnetico',
  'term.': 'termomagnetico',
  'sx': 'hexagonal',
  'bc': 'zincado',
  'ri': 'rosca entera',
  'hex': 'hexagonal',
  'art': 'articulo',
  'pvc': 'pvc',
  'pt': 'puestos tierra',
  'mm2': 'mm',
};

export function normalizeText(text: string): string {
  if (!text) return '';
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes y diacríticos
    .replace(/[^a-z0-9\s\.\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Expansión inteligente de abreviaturas frecuentes de ferreterías
  const words = cleaned.split(' ').map(w => COMMON_ABBREVIATIONS[w] || w);
  return words.join(' ');
}

/**
 * Genera el conjunto de trigramas de una cadena, emulando pg_trgm de PostgreSQL
 */
export function getTrigrams(str: string): Set<string> {
  const padded = `  ${str} `;
  const trigrams = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Calcula la similitud de trigramas entre dos textos (entre 0.0 y 1.0)
 */
export function calculateTrigramSimilarity(strA: string, strB: string): number {
  const normA = normalizeText(strA);
  const normB = normalizeText(strB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const isSubstring = normB.includes(normA) || normA.includes(normB);

  const triA = getTrigrams(normA);
  const triB = getTrigrams(normB);

  let intersectionCount = 0;
  for (const tri of triA) {
    if (triB.has(tri)) {
      intersectionCount++;
    }
  }

  const unionCount = triA.size + triB.size - intersectionCount;
  if (unionCount === 0) return 0;

  let baseScore = intersectionCount / unionCount;

  if (isSubstring) {
    baseScore = Math.min(1.0, baseScore * 0.7 + 0.3);
  }

  return baseScore;
}

/**
 * Extrae números y calibres clave (ej: '20x3', '2.5', '10x25', '16', 'sh203')
 */
export function extractKeyTokens(str: string): string[] {
  const norm = normalizeText(str);
  const tokens = norm.split(' ').filter(w => w.length > 0);
  return tokens;
}

/**
 * Coincidencia por tokens y calibres con peso para especificaciones numéricas
 */
export function tokenOverlapScore(query: string, target: string): number {
  const qWords = extractKeyTokens(query);
  const tNorm = normalizeText(target);

  if (qWords.length === 0) return 0;

  let matchedWeight = 0;
  let totalWeight = 0;

  for (const word of qWords) {
    // Los números y calibres (ej 20x3, 2.5, 3p, abb, 10x25) tienen mayor relevancia
    const isDimensionOrCode = /\d/.test(word) || word.length >= 4;
    const weight = isDimensionOrCode ? 2 : 1;
    totalWeight += weight;

    if (tNorm.includes(word)) {
      matchedWeight += weight;
    }
  }

  return totalWeight > 0 ? matchedWeight / totalWeight : 0;
}

/**
 * Puntuación combinada óptima para materiales de ferretería
 */
export function matchScore(query: string, candidate: string): number {
  const triScore = calculateTrigramSimilarity(query, candidate);
  const tokScore = tokenOverlapScore(query, candidate);

  // Fuerte bonus si coinciden las especificaciones de calibre/dimensión
  const combined = triScore * 0.4 + tokScore * 0.6;
  return Math.round(combined * 100) / 100;
}

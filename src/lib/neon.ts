import { neon, NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Cliente Serverless de Neon PostgreSQL
 * Se activa si existe DATABASE_URL o POSTGRES_URL en el entorno (Vercel / Local)
 */
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

export const isNeonConfigured = (): boolean => {
  return Boolean(databaseUrl && databaseUrl.startsWith('postgres'));
};

export const getDb = (): NeonQueryFunction<false, false> | null => {
  if (!isNeonConfigured()) return null;
  return neon(databaseUrl);
};

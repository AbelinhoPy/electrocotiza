import { neon, NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Cliente Serverless de Neon PostgreSQL
 * Se activa si existe DATABASE_URL o POSTGRES_URL en el entorno (Vercel / Local)
 */
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://neondb_owner:npg_fs48GgIkHlVe@ep-weathered-lab-b4ub6git-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const isNeonConfigured = (): boolean => {
  return Boolean(databaseUrl && databaseUrl.startsWith('postgres'));
};

export const getDb = (): NeonQueryFunction<false, false> | null => {
  if (!isNeonConfigured()) return null;
  return neon(databaseUrl);
};

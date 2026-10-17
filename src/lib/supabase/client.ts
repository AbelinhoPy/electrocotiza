import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Cliente de Supabase condicional:
 * - Si las variables de entorno existen en Vercel/.env, se conecta a la base de datos PostgreSQL en la nube.
 * - Si no existen, retorna null y la app opera en modo Local-First (localStorage).
 */
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

import { NextResponse } from 'next/server';
import { getDb, isNeonConfigured } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isNeonConfigured()) {
    return NextResponse.json({
      status: 'local_mode',
      provider: 'local_storage',
      message: 'Operando en modo Local-First (sin DATABASE_URL configurada)',
      configured: false,
    });
  }

  try {
    const sql = getDb();
    if (!sql) {
      throw new Error('No se pudo inicializar el cliente Neon');
    }

    const versionRes = await sql`SELECT version();`;
    const orgRes = await sql`SELECT count(*) FROM organizations;`;
    const prodRes = await sql`SELECT count(*) FROM canonical_products;`;
    const provRes = await sql`SELECT count(*) FROM providers;`;
    const aliasRes = await sql`SELECT count(*) FROM product_aliases;`;

    return NextResponse.json({
      status: 'connected',
      provider: 'neon_postgres',
      configured: true,
      database: 'PostgreSQL Serverless (Neon Cloud)',
      stats: {
        organizations: Number(orgRes[0]?.count || 0),
        products: Number(prodRes[0]?.count || 0),
        providers: Number(provRes[0]?.count || 0),
        aliases: Number(aliasRes[0]?.count || 0),
      },
      postgresVersion: String(versionRes[0]?.version || '').split(' ')[1] || '18.x',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        provider: 'neon_postgres',
        configured: true,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

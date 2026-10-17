import { NextResponse } from 'next/server';
import { getDb, isNeonConfigured } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!isNeonConfigured()) {
    return NextResponse.json({
      source: 'local_mode',
      products: [],
      message: 'Base de datos en la nube no configurada en este endpoint. Use storage local.',
    });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Cliente Neon no disponible');

    let rows;
    if (q.trim()) {
      rows = await sql`
        SELECT 
          p.id, 
          p.code, 
          p.name, 
          p.brand, 
          p.unit, 
          p.description,
          c.name as category_name
        FROM canonical_products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name ILIKE ${'%' + q + '%'} 
           OR p.code ILIKE ${'%' + q + '%'}
           OR p.normalized_name ILIKE ${'%' + q + '%'}
        LIMIT 50;
      `;
    } else {
      rows = await sql`
        SELECT 
          p.id, 
          p.code, 
          p.name, 
          p.brand, 
          p.unit, 
          p.description,
          c.name as category_name
        FROM canonical_products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name ASC
        LIMIT 50;
      `;
    }

    return NextResponse.json({
      source: 'neon_postgres',
      count: rows.length,
      products: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        source: 'error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

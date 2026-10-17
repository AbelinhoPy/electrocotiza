import { NextResponse } from 'next/server';
import { getDb, isNeonConfigured } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isNeonConfigured()) {
    return NextResponse.json({
      status: 'local_only',
      invoices: [],
      message: 'Base de datos Neon no configurada. Operando en almacenamiento local.',
    });
  }

  try {
    const sql = getDb();
    if (!sql) throw new Error('Cliente de base de datos no disponible');

    const invoices = await sql`
      SELECT 
        i.id,
        i.invoice_number,
        i.timbrado,
        i.ruc,
        i.issue_date,
        i.payment_condition,
        i.total_pyg,
        i.subtotal_pyg,
        i.iva_10_pyg,
        p.name as provider_name,
        p.id as provider_id
      FROM invoices i
      LEFT JOIN providers p ON i.provider_id = p.id
      ORDER BY i.issue_date DESC
      LIMIT 100;
    `;

    return NextResponse.json({
      status: 'success',
      count: invoices.length,
      invoices,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      provider_name,
      ruc,
      invoice_number,
      timbrado,
      issue_date,
      payment_condition = 'contado',
      total_pyg,
      subtotal_pyg,
      iva_10_pyg,
      file_url,
      file_name,
      items = [],
    } = body;

    if (!isNeonConfigured()) {
      return NextResponse.json({
        success: true,
        savedToDb: false,
        message: 'Guardado en modo local (sin conexión a Neon).',
      });
    }

    const sql = getDb();
    if (!sql) throw new Error('Cliente de base de datos no disponible');

    // 1. Obtener la organización principal
    const orgRes = await sql`SELECT id FROM organizations LIMIT 1;`;
    const orgId = orgRes[0]?.id || 'a0000000-0000-0000-0000-000000000001';

    // 2. Buscar o crear el proveedor
    let providerId: string;
    const cleanRuc = (ruc || '').trim();
    const cleanProvName = (provider_name || 'Proveedor General').trim();

    let provRes = await sql`
      SELECT id FROM providers 
      WHERE (ruc = ${cleanRuc} AND ${cleanRuc} != '') 
         OR name ILIKE ${cleanProvName} 
      LIMIT 1;
    `;

    if (provRes.length > 0) {
      providerId = provRes[0].id;
    } else {
      const newProv = await sql`
        INSERT INTO providers (organization_id, name, ruc, city)
        VALUES (${orgId}, ${cleanProvName}, ${cleanRuc || '80000000-0'}, 'Ciudad del Este')
        RETURNING id;
      `;
      providerId = newProv[0].id;
    }

    // 3. Crear registro de fuente (source)
    const sourceRes = await sql`
      INSERT INTO sources (
        organization_id, 
        provider_id, 
        source_type, 
        file_name, 
        status
      ) VALUES (
        ${orgId}, 
        ${providerId}, 
        'invoice_photo', 
        ${file_name || 'Comprobante escaneado en obra'}, 
        'approved'
      )
      RETURNING id;
    `;
    const sourceId = sourceRes[0].id;

    // 4. Crear o actualizar la factura
    const cleanInvNum = (invoice_number || `001-001-${Math.floor(1000000 + Math.random() * 9000000)}`).trim();
    const cleanTimbrado = (timbrado || '18000000').trim();
    const cleanDate = issue_date || new Date().toISOString().split('T')[0];
    const totalPygNum = Math.round(Number(total_pyg) || 0);
    const subtotalPygNum = Math.round(Number(subtotal_pyg) || totalPygNum);
    const iva10PygNum = Math.round(Number(iva_10_pyg) || (totalPygNum / 11));

    const invRes = await sql`
      INSERT INTO invoices (
        organization_id,
        source_id,
        provider_id,
        invoice_number,
        timbrado,
        ruc,
        issue_date,
        payment_condition,
        subtotal_pyg,
        iva_10_pyg,
        total_pyg,
        status,
        notes
      ) VALUES (
        ${orgId},
        ${sourceId},
        ${providerId},
        ${cleanInvNum},
        ${cleanTimbrado},
        ${cleanRuc || '80000000-0'},
        ${cleanDate},
        ${payment_condition},
        ${subtotalPygNum},
        ${iva10PygNum},
        ${totalPygNum},
        'confirmed',
        'Ingresado por Lucas Duré desde ElectroCotiza PWA'
      )
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;

    const invoiceId = invRes[0]?.id || sourceId;

    // 5. Guardar cada ítem y actualizar historial de precios
    let itemsSaved = 0;
    for (const item of items) {
      const rawDesc = (item.raw_description || '').trim();
      if (!rawDesc) continue;

      const qty = Number(item.quantity) || 1;
      const unit = item.unit || 'un';
      const unitCost = Math.round(Number(item.unit_cost_pyg) || 0);
      const totalCost = Math.round(Number(item.total_pyg) || (unitCost * qty));

      // Buscar coincidencia canónica en base de datos si no fue provista
      let canonicalId = item.canonical_id || item.suggested_canonical_id;
      if (!canonicalId) {
        const matchRes = await sql`
          SELECT id FROM canonical_products 
          WHERE name ILIKE ${'%' + rawDesc + '%'}
             OR normalized_name ILIKE ${'%' + rawDesc.toLowerCase() + '%'}
          LIMIT 1;
        `;
        if (matchRes.length > 0) {
          canonicalId = matchRes[0].id;
        }
      }

      // Insertar en source_items
      await sql`
        INSERT INTO source_items (
          organization_id,
          source_id,
          invoice_id,
          raw_description,
          quantity,
          unit,
          unit_cost_pyg,
          iva_rate,
          total_pyg,
          confirmed_canonical_id,
          is_reviewed
        ) VALUES (
          ${orgId},
          ${sourceId},
          ${invoiceId},
          ${rawDesc},
          ${qty},
          ${unit},
          ${unitCost},
          10.00,
          ${totalCost},
          ${canonicalId || null},
          TRUE
        );
      `;

      // Si tiene producto canónico vinculado y costo > 0, registrar en historial de precios
      if (canonicalId && unitCost > 0) {
        await sql`
          INSERT INTO price_history (
            organization_id,
            canonical_product_id,
            provider_id,
            price_pyg,
            date,
            source_type,
            source_ref
          ) VALUES (
            ${orgId},
            ${canonicalId},
            ${providerId},
            ${unitCost},
            ${cleanDate},
            'invoice_photo',
            ${'Factura ' + cleanInvNum}
          );
        `;

        // Actualizar último precio en el catálogo canónico
        await sql`
          UPDATE canonical_products
          SET 
            last_price_pyg = ${unitCost},
            last_price_date = ${cleanDate},
            min_price_pyg = LEAST(min_price_pyg, ${unitCost}),
            max_price_pyg = GREATEST(max_price_pyg, ${unitCost}),
            updated_at = NOW()
          WHERE id = ${canonicalId};
        `;
      }

      itemsSaved++;
    }

    return NextResponse.json({
      success: true,
      savedToDb: true,
      invoice_id: invoiceId,
      provider_id: providerId,
      items_saved: itemsSaved,
      message: `Factura ${cleanInvNum} y ${itemsSaved} ítems guardados exitosamente en Neon PostgreSQL.`,
    });
  } catch (error: any) {
    console.error('Error guardando factura en Neon:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

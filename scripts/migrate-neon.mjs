import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fs48GgIkHlVe@ep-weathered-lab-b4ub6git-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function splitSqlStatements(sqlText) {
  const statements = [];
  let current = '';
  let inDollarBlock = false;
  let dollarTag = '';

  const lines = sqlText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') && !inDollarBlock) {
      continue;
    }

    // Check for $$ or $tag$
    const matches = line.match(/\$[a-zA-Z0-9_]*\$/g);
    if (matches) {
      for (const m of matches) {
        if (!inDollarBlock) {
          inDollarBlock = true;
          dollarTag = m;
        } else if (m === dollarTag) {
          inDollarBlock = false;
          dollarTag = '';
        }
      }
    }

    current += line + '\n';

    if (!inDollarBlock && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

async function runMigration() {
  console.log('⚡ CONECTANDO A NEON POSTGRESQL...');
  console.log('Host:', DATABASE_URL.split('@')[1]?.split('/')[0]);

  const sql = neon(DATABASE_URL);

  try {
    // 1. Probar conexión básica
    const versionResult = await sql`SELECT version();`;
    console.log('✅ Conexión establecida exitosamente!');
    console.log('Versión:', versionResult[0]?.version);

    // 2. Ejecutar schema.sql
    const schemaPath = path.resolve(__dirname, '../supabase/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const schemaStmts = splitSqlStatements(schemaSql);
    console.log(`\n📄 Ejecutando schema.sql (${schemaStmts.length} sentencias DDL)...`);

    let executedSchema = 0;
    for (const stmt of schemaStmts) {
      try {
        await sql.query(stmt);
        executedSchema++;
      } catch (err) {
        console.error(`⚠️ Error en sentencia schema:\n${stmt.slice(0, 100)}...\n-> ${err.message}`);
        throw err;
      }
    }
    console.log(`✅ ${executedSchema} sentencias DDL ejecutadas con éxito en Neon!`);

    // 3. Ejecutar seed.sql
    const seedPath = path.resolve(__dirname, '../supabase/seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    const seedStmts = splitSqlStatements(seedSql);
    console.log(`\n🌱 Ejecutando seed.sql (${seedStmts.length} inserciones de datos maestros)...`);

    let executedSeed = 0;
    for (const stmt of seedStmts) {
      try {
        await sql.query(stmt);
        executedSeed++;
      } catch (err) {
        console.error(`⚠️ Error en sentencia seed:\n${stmt.slice(0, 100)}...\n-> ${err.message}`);
        throw err;
      }
    }
    console.log(`✅ ${executedSeed} inserciones de datos seed completadas con éxito!`);

    // 4. Verificación de integridad en la base de datos
    console.log('\n🔍 VERIFICACIÓN DE INTEGRIDAD EN NEON CLOUD:');
    const orgs = await sql`SELECT count(*) FROM organizations;`;
    const settings = await sql`SELECT company_name, ruc, bank_name, bank_account_number, bank_sipap_alias FROM settings;`;
    const providers = await sql`SELECT count(*) FROM providers;`;
    const products = await sql`SELECT count(*) FROM canonical_products;`;
    const aliases = await sql`SELECT count(*) FROM product_aliases;`;
    const budgets = await sql`SELECT count(*) FROM budgets;`;

    console.log(`- Organizaciones: ${orgs[0]?.count}`);
    console.log(`- Empresa: ${settings[0]?.company_name} (RUC: ${settings[0]?.ruc})`);
    console.log(`- Banco SIPAP: ${settings[0]?.bank_name} - Cta: ${settings[0]?.bank_account_number} (Alias: ${settings[0]?.bank_sipap_alias})`);
    console.log(`- Proveedores paraguayos: ${providers[0]?.count}`);
    console.log(`- Productos canónicos: ${products[0]?.count}`);
    console.log(`- Alias de materiales: ${aliases[0]?.count}`);
    console.log(`- Presupuestos de muestra: ${budgets[0]?.count}`);

    console.log('\n🎉 ¡BASE DE DATOS NEON LISTA Y EN PRODUCCIÓN!');
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
    process.exit(1);
  }
}

runMigration();

import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const sql = neon('postgresql://neondb_owner:npg_fs48GgIkHlVe@ep-weathered-lab-b4ub6git-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require');

async function updatePasswords() {
  const adminHashStar = hashPassword('Admin2026*');
  const secHashStar = hashPassword('Secretaria2026*');

  await sql`UPDATE app_users SET password_hash = ${adminHashStar} WHERE email = 'admin@construlogica.com.py'`;
  await sql`UPDATE app_users SET password_hash = ${secHashStar} WHERE email = 'secretaria@construlogica.com.py'`;

  console.log('Updated passwords in Neon successfully to Admin2026* and Secretaria2026*');
}

updatePasswords().catch(console.error);

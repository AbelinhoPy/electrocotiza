import { getDb, isNeonConfigured } from '../neon';
import { hashPassword } from './password';

export interface AppUser {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: 'admin' | 'secretaria' | string;
  status: 'active' | 'inactive' | 'invited';
  phone?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// Usuarios en memoria para fallback offline o desarrollo local
let memoryUsers: AppUser[] = [
  {
    id: 'usr-lucas-admin',
    email: 'admin@construlogica.com.py',
    full_name: 'Ing. Lucas Duré',
    role: 'admin',
    status: 'active',
    phone: '+595 983 530890',
    // Hash por defecto para setup inicial: 'Admin2026*'
    password_hash: hashPassword('Admin2026*'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-secretaria-demo',
    email: 'secretaria@construlogica.com.py',
    full_name: 'Ana López (Secretaría)',
    role: 'secretaria',
    status: 'active',
    phone: '+595 981 778899',
    password_hash: hashPassword('Secretaria2026*'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let tableInitialized = false;

async function ensureTable(): Promise<void> {
  if (tableInitialized || !isNeonConfigured()) return;
  const db = getDb();
  if (!db) return;

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'secretaria',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        phone VARCHAR(50),
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    // Verificar si existe el administrador
    const existing = await db.query(`SELECT count(*) FROM app_users WHERE role = 'admin' AND status = 'active'`);
    if (Number(existing[0]?.count || 0) === 0) {
      // Crear administrador inicial Lucas Duré
      const adminPassHash = hashPassword('Admin2026!');
      await db.query(
        `INSERT INTO app_users (email, password_hash, full_name, role, status, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'active'`,
        ['admin@construlogica.com.py', adminPassHash, 'Ing. Lucas Duré', 'admin', 'active', '+595 983 530890']
      );

      // Crear secretaria inicial
      const secPassHash = hashPassword('Secretaria2026!');
      await db.query(
        `INSERT INTO app_users (email, password_hash, full_name, role, status, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        ['secretaria@construlogica.com.py', secPassHash, 'Ana López (Secretaría)', 'secretaria', 'active', '+595 981 778899']
      );
    }

    tableInitialized = true;
  } catch (err: any) {
    console.error('Error al inicializar app_users en Neon:', err.message);
  }
}

export const UserStore = {
  async getUserByEmail(email: string): Promise<AppUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    await ensureTable();

    const db = getDb();
    if (db) {
      try {
        const rows = await db.query(
          `SELECT id, email, password_hash, full_name, role, status, phone, last_login_at, created_at, updated_at
           FROM app_users
           WHERE LOWER(email) = $1
           LIMIT 1`,
          [cleanEmail]
        );
        if (rows.length > 0) {
          const r = rows[0] as any;
          return {
            id: r.id,
            email: r.email,
            password_hash: r.password_hash,
            full_name: r.full_name,
            role: r.role,
            status: r.status,
            phone: r.phone || '',
            last_login_at: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
            created_at: new Date(r.created_at).toISOString(),
            updated_at: new Date(r.updated_at).toISOString(),
          };
        }
      } catch (err) {
        console.warn('Fallo consulta a Neon, usando fallback local:', err);
      }
    }

    const found = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
    return found || null;
  },

  async getUserById(id: string): Promise<AppUser | null> {
    await ensureTable();
    const db = getDb();
    if (db) {
      try {
        const rows = await db.query(
          `SELECT id, email, password_hash, full_name, role, status, phone, last_login_at, created_at, updated_at
           FROM app_users
           WHERE id::text = $1
           LIMIT 1`,
          [id]
        );
        if (rows.length > 0) {
          const r = rows[0] as any;
          return {
            id: r.id,
            email: r.email,
            password_hash: r.password_hash,
            full_name: r.full_name,
            role: r.role,
            status: r.status,
            phone: r.phone || '',
            last_login_at: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
            created_at: new Date(r.created_at).toISOString(),
            updated_at: new Date(r.updated_at).toISOString(),
          };
        }
      } catch (err) {
        console.warn('Fallo consulta a Neon por ID:', err);
      }
    }

    const found = memoryUsers.find(u => u.id === id);
    return found || null;
  },

  async listUsers(): Promise<Omit<AppUser, 'password_hash'>[]> {
    await ensureTable();
    const db = getDb();
    if (db) {
      try {
        const rows = await db.query(
          `SELECT id, email, full_name, role, status, phone, last_login_at, created_at, updated_at
           FROM app_users
           ORDER BY created_at ASC`
        );
        return rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          full_name: r.full_name,
          role: r.role,
          status: r.status,
          phone: r.phone || '',
          last_login_at: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
          created_at: new Date(r.created_at).toISOString(),
          updated_at: new Date(r.updated_at).toISOString(),
        }));
      } catch (err) {
        console.warn('Fallo listUsers en Neon:', err);
      }
    }

    return memoryUsers.map(({ password_hash, ...rest }) => rest);
  },

  async createUser(data: {
    email: string;
    full_name: string;
    role: 'admin' | 'secretaria';
    password?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'invited';
  }): Promise<AppUser> {
    await ensureTable();
    const cleanEmail = data.email.trim().toLowerCase();
    const hash = data.password ? hashPassword(data.password) : undefined;
    const initialStatus = data.status || 'active';

    const db = getDb();
    if (db) {
      const rows = await db.query(
        `INSERT INTO app_users (email, password_hash, full_name, role, status, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role, status, phone, created_at, updated_at`,
        [cleanEmail, hash, data.full_name.trim(), data.role, initialStatus, data.phone || '']
      );
      const r = rows[0] as any;
      const newUser: AppUser = {
        id: r.id,
        email: r.email,
        full_name: r.full_name,
        role: r.role,
        status: r.status,
        phone: r.phone,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      };
      memoryUsers.push(newUser);
      return newUser;
    }

    const newUser: AppUser = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      password_hash: hash,
      full_name: data.full_name.trim(),
      role: data.role,
      status: initialStatus,
      phone: data.phone || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryUsers.push(newUser);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<Pick<AppUser, 'full_name' | 'role' | 'status' | 'phone'>>): Promise<AppUser | null> {
    await ensureTable();

    // Si se intenta desactivar o quitar rol admin, verificar que no sea el último admin activo
    if (updates.status === 'inactive' || (updates.role && updates.role !== 'admin')) {
      const activeAdmins = await this.countActiveAdmins();
      const currentUser = await this.getUserById(id);
      if (currentUser?.role === 'admin' && currentUser?.status === 'active' && activeAdmins <= 1) {
        throw new Error('Operación no permitida: No puedes desactivar ni cambiar el rol del último administrador activo.');
      }
    }

    const db = getDb();
    if (db) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.full_name !== undefined) {
        fields.push(`full_name = $${idx++}`);
        values.push(updates.full_name.trim());
      }
      if (updates.role !== undefined) {
        fields.push(`role = $${idx++}`);
        values.push(updates.role);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(updates.status);
      }
      if (updates.phone !== undefined) {
        fields.push(`phone = $${idx++}`);
        values.push(updates.phone);
      }
      fields.push(`updated_at = timezone('utc'::text, now())`);

      values.push(id);
      const queryStr = `UPDATE app_users SET ${fields.join(', ')} WHERE id::text = $${idx} RETURNING *`;
      const rows = await db.query(queryStr, values);
      if (rows.length > 0) {
        const r = rows[0] as any;
        return {
          id: r.id,
          email: r.email,
          full_name: r.full_name,
          role: r.role,
          status: r.status,
          phone: r.phone,
          created_at: new Date(r.created_at).toISOString(),
          updated_at: new Date(r.updated_at).toISOString(),
        };
      }
    }

    const memIdx = memoryUsers.findIndex(u => u.id === id);
    if (memIdx >= 0) {
      memoryUsers[memIdx] = {
        ...memoryUsers[memIdx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return memoryUsers[memIdx];
    }
    return null;
  },

  async setUserPassword(id: string, newPassword: string): Promise<void> {
    await ensureTable();
    const hash = hashPassword(newPassword);

    const db = getDb();
    if (db) {
      await db.query(`UPDATE app_users SET password_hash = $1, updated_at = timezone('utc'::text, now()) WHERE id::text = $2`, [hash, id]);
    }

    const memIdx = memoryUsers.findIndex(u => u.id === id);
    if (memIdx >= 0) {
      memoryUsers[memIdx].password_hash = hash;
      memoryUsers[memIdx].updated_at = new Date().toISOString();
    }
  },

  async recordLogin(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await db.query(`UPDATE app_users SET last_login_at = timezone('utc'::text, now()) WHERE id::text = $1`, [id]);
      } catch {}
    }
    const mem = memoryUsers.find(u => u.id === id);
    if (mem) {
      mem.last_login_at = new Date().toISOString();
    }
  },

  async countActiveAdmins(): Promise<number> {
    const db = getDb();
    if (db) {
      try {
        const res = await db.query(`SELECT count(*) FROM app_users WHERE role = 'admin' AND status = 'active'`);
        return Number(res[0]?.count || 0);
      } catch {}
    }
    return memoryUsers.filter(u => u.role === 'admin' && u.status === 'active').length;
  },
};

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { UserStore } from '@/lib/auth/user-store';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return { error: 'No autenticado', status: 401 };
  }

  const user = await UserStore.getUserById(session.userId);
  if (!user || user.status !== 'active') {
    return { error: 'Sesión no válida', status: 401 };
  }

  if (user.role !== 'admin') {
    return { error: 'Acceso restringido: Se requieren permisos de Administrador.', status: 403 };
  }

  return { adminUser: user };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const users = await UserStore.listUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al listar usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { email, full_name, role, password, phone, status } = body;

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'El nombre completo y correo electrónico son obligatorios.' },
        { status: 400 }
      );
    }

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { error: 'Debes ingresar una contraseña inicial de al menos 6 caracteres para la activación de la cuenta.' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await UserStore.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario registrado con este correo electrónico.' },
        { status: 409 }
      );
    }

    const assignedRole = role === 'admin' ? 'admin' : 'secretaria';
    const newUser = await UserStore.createUser({
      email,
      full_name,
      role: assignedRole,
      password: password.trim(),
      phone,
      status: status || 'active',
    });

    const { password_hash, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, full_name, role, status, phone, new_password } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    if (new_password) {
      await UserStore.setUserPassword(id, new_password);
    }

    const updated = await UserStore.updateUser(id, {
      full_name,
      role,
      status,
      phone,
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar usuario' }, { status: 400 });
  }
}

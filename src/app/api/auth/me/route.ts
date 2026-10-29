import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { UserStore } from '@/lib/auth/user-store';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar estado activo en el almacén de usuarios (para invalidar si fue desactivado)
    const user = await UserStore.getUserById(session.userId);
    if (!user || user.status !== 'active') {
      const response = NextResponse.json({ error: 'Sesión invalidada' }, { status: 401 });
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        phone: user.phone,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al verificar sesión' }, { status: 500 });
  }
}

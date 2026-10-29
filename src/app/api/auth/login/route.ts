import { NextRequest, NextResponse } from 'next/server';
import { UserStore } from '@/lib/auth/user-store';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu correo y contraseña.' },
        { status: 400 }
      );
    }

    const user = await UserStore.getUserByEmail(email);

    // Mensaje discreto sin revelar existencia del correo
    const invalidCredentialsResponse = NextResponse.json(
      { error: 'Correo electrónico o contraseña incorrectos.' },
      { status: 401 }
    );

    if (!user || !user.password_hash) {
      return invalidCredentialsResponse;
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Tu cuenta se encuentra inactiva o suspendida. Contacta al administrador.' },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return invalidCredentialsResponse;
    }

    // Registrar fecha de acceso
    await UserStore.recordLogin(user.id);

    // Crear token de sesión
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        phone: user.phone,
      },
    });

    // Fijar cookie segura HttpOnly
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 días
    });

    return response;
  } catch (error: any) {
    console.error('Error en login API:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar el ingreso.' },
      { status: 500 }
    );
  }
}

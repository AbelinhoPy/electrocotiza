import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rutas públicas exentas de autenticación
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt';

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Extraer y verificar token de sesión
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // 3. Si no hay sesión válida o activa
  if (!session || session.status !== 'active') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    // Redirigir al login
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // 4. Protección de rutas restringidas solo para Administrador
  const isAdminOnlyRoute =
    pathname === '/usuarios' ||
    pathname.startsWith('/usuarios/') ||
    pathname === '/configuracion' ||
    pathname.startsWith('/configuracion/');

  if (isAdminOnlyRoute && session.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Acceso restringido: Se requieren permisos de Administrador.' },
        { status: 403 }
      );
    }
    // Redirigir al inicio si es secretaria u otro rol
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

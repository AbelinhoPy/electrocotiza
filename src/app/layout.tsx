import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'ElectroCotiza - Construlogica Emprendimientos S.A.',
  description: 'Sistema de cotizaciones y gestión técnica para empresas de instalaciones eléctricas en Paraguay.',
  applicationName: 'ElectroCotiza',
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen selection:bg-amber-400 selection:text-slate-950">
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

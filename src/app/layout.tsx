import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'ElectroCotiza - Construlogica Emprendimientos S.A.',
  description: 'Sistema de cotizaciones y homologación de precios eléctricos para electricistas y contratistas en Paraguay.',
  applicationName: 'ElectroCotiza',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ElectroCotiza',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0F2137',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-slate-100 font-sans antialiased pb-24 md:pb-6 selection:bg-amber-400 selection:text-slate-950">
        <AuthGuard>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <MobileNav />
        </AuthGuard>
      </body>
    </html>
  );
}

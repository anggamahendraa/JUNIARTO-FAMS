import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaRegistrar from '@/components/pwa/PwaRegistrar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0f1a',
};

export const metadata: Metadata = {
  title: 'Silsilah Keluarga — Family Tree App',
  description: 'Aplikasi silsilah keluarga interaktif untuk melihat, mengelola, dan menjelajahi pohon keluarga Anda.',
  keywords: ['silsilah keluarga', 'family tree', 'pohon keluarga', 'genealogi'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Silsilah',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-gradient-mesh min-h-screen">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}

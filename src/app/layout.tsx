import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Silsilah Keluarga — Family Tree App',
  description: 'Aplikasi silsilah keluarga interaktif untuk melihat, mengelola, dan menjelajahi pohon keluarga Anda.',
  keywords: ['silsilah keluarga', 'family tree', 'pohon keluarga', 'genealogi'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-gradient-mesh min-h-screen">
        {children}
      </body>
    </html>
  );
}

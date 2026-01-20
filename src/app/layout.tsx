import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Zeni App',
  description: 'Sua gestão financeira simplificada',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#000000' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} ${sora.variable} font-sans antialiased bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

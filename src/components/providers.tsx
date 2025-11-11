'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { BalanceVisibilityProvider } from '@/contexts/BalanceVisibilityContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <BalanceVisibilityProvider>
            <ThemeColorSync />
            {children}
          </BalanceVisibilityProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemeColorSync() {
  // Sync meta[name="theme-color"] at runtime to follow manual theme toggles
  const { theme } = useTheme();
  const color = theme === 'dark' ? '#0F172A' : '#ffffff';
  // eslint-disable-next-line react-hooks/rules-of-hooks
  (function update() {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    if (meta.getAttribute('content') !== color) meta.setAttribute('content', color);
  })();
  return null;
}

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { BalanceVisibilityProvider } from '@/contexts/BalanceVisibilityContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { PreviewTransactionProvider } from '@/contexts/PreviewTransactionContext';

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
          <LoadingProvider>
            <BalanceVisibilityProvider>
              <PreviewTransactionProvider>
                <ToastProvider>
                  <ThemeColorSync />
                  {children}
                </ToastProvider>
              </PreviewTransactionProvider>
            </BalanceVisibilityProvider>
          </LoadingProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * ThemeColorSync component
 * Synchronizes the meta theme-color tag with the current theme state
 * This ensures the browser/PWA status bar color matches the app theme
 */
function ThemeColorSync() {
  const { theme } = useTheme();
  
  useEffect(() => {
    // Skip if not in browser environment
    if (typeof document === 'undefined') return;
    
    // Light theme uses white, dark theme uses gray-900
    const color = theme === 'dark' ? '#111827' : '#ffffff';
    
    // Get or create the theme-color meta tag
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    
    // Update the content attribute
    meta.setAttribute('content', color);
  }, [theme]);
  
  return null;
}

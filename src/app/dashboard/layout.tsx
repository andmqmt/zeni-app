'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeToken } from '@/lib/api/client';
import FloatingTransactionButton from '@/components/FloatingTransactionButton';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return null;
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}

function DashboardLayoutClient({ children }: DashboardLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <main className="flex-1 min-h-screen pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile FAB — new transaction */}
      <FloatingTransactionButton />
    </div>
  );
}

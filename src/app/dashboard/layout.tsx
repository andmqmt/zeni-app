'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Receipt, Settings, LogOut, Menu, X, Eye, EyeOff } from 'lucide-react';
import { removeToken } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBalanceVisibility } from '@/contexts/BalanceVisibilityContext';
import ThemeLanguageControls from '@/components/ThemeLanguageControls';
import FloatingTransactionButton from '@/components/FloatingTransactionButton';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}

function DashboardLayoutClient({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { isVisible, toggleVisibility } = useBalanceVisibility();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const navigation = [
    { name: t('nav.home'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.transactions'), href: '/dashboard/transactions', icon: Receipt },
    { name: t('nav.settings'), href: '/dashboard/profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="md:hidden bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-black/95">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Zeni</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVisibility}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isVisible ? t('common.hideValues') : t('common.showValues')}
          >
            {isVisible ? <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <EyeOff className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-900 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-900 dark:text-white" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-2 animate-slide-up">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t('nav.logout')}
            </button>
          </nav>
        </div>
      )}

      <div className="flex">
        <aside className="hidden md:flex md:flex-col md:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen sticky top-0">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Zeni</h1>
            <button
              onClick={toggleVisibility}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isVisible ? t('common.hideValues') : t('common.showValues')}
            >
              {isVisible ? <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t('nav.logout')}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8 bg-white dark:bg-black min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <FloatingTransactionButton />
    </div>
  );
}

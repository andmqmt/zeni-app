'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Receipt, Settings, LogOut, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { removeToken } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBalanceVisibility } from '@/contexts/BalanceVisibilityContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { t } = useLanguage();
  const { isVisible, toggleVisibility } = useBalanceVisibility();
  const { theme, toggleTheme } = useTheme();

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
      {/* Mobile top bar — minimal, no hamburger, slim */}
      <div className="md:hidden bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Zeni</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleVisibility}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            title={isVisible ? t('common.hideValues') : t('common.showValues')}
          >
            {isVisible ? <Eye className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" /> : <EyeOff className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-gray-400" /> : <Moon className="w-4.5 h-4.5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile bottom nav — tab bar, like Nubank/Inter */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-900 z-40 flex items-center justify-around px-2 py-1 safe-area-pb">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-gray-400 dark:text-gray-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">{t('nav.logout')}</span>
        </button>
      </nav>

      <div className="flex">
        {/* Desktop sidebar — clean, minimal */}
        <aside className="hidden md:flex md:flex-col md:w-60 bg-white dark:bg-black border-r border-gray-100 dark:border-gray-900 min-h-screen sticky top-0">
          <div className="p-5 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Zeni</h1>
            <div className="flex items-center gap-0.5">
              <button
                onClick={toggleVisibility}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                title={isVisible ? t('common.hideValues') : t('common.showValues')}
              >
                {isVisible ? <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-gray-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>
          <nav className="flex-1 px-3 py-2 space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="h-[18px] w-[18px]" />
              {t('nav.logout')}
            </button>
          </div>
        </aside>

        <main className="flex-1 min-h-screen bg-gray-50 dark:bg-black pb-20 md:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-6">
            {children}
          </div>
        </main>
      </div>

      <FloatingTransactionButton />
    </div>
  );
}

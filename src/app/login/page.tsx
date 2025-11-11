'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth.service';
import { handleApiError } from '@/lib/utils/error';
import { Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ThemeLanguageControls from '@/components/ThemeLanguageControls';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({ identifier, password });
      router.push('/dashboard');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeLanguageControls />
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
            <h1 className="font-display text-4xl font-bold">Zeni</h1>
          </div>
          <h2 className="text-display-md mb-6">
            {t('login.hero.title')}<br/>
            <span className="text-primary-200">{t('login.hero.subtitle')}</span>
          </h2>
          <p className="text-lg text-primary-100 max-w-md leading-relaxed">
            {t('login.hero.description')}
          </p>
        </div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Zeni</h1>
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              {t('login.welcome')}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('login.subtitle')}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4">
                <p className="text-sm text-danger-700 dark:text-danger-400 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.email')}
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-medium hover:shadow-hard"
              >
                {loading ? t('login.submitting') : t('login.submit')}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                {t('login.noAccount')} <span className="underline">{t('login.register')}</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

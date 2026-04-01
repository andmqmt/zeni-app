'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth.service';
import { handleApiError } from '@/lib/utils/error';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import ThemeLanguageControls from '@/components/ThemeLanguageControls';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
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
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeLanguageControls />
      </div>

      {/* Left panel — brand hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 dark:bg-gray-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-white/5 dark:border-gray-900/5" />
        <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border border-white/5 dark:border-gray-900/5" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-emerald-500/5 dark:bg-emerald-500/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white dark:text-gray-900">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center">
              <span className="text-gray-900 dark:text-white text-xl font-bold">Z</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Zeni</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            {t('login.hero.title')}<br/>
            <span className="text-gray-400 dark:text-gray-500">{t('login.hero.subtitle')}</span>
          </h2>
          <p className="text-base text-gray-400 dark:text-gray-500 max-w-md leading-relaxed">
            {t('login.hero.description')}
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12 bg-white dark:bg-black">
        <div className="max-w-sm w-full">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
              <span className="text-white dark:text-gray-900 text-lg font-bold">Z</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Zeni</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('login.welcome')}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {t('login.subtitle')}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3.5">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                {t('login.email')}
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                {t('login.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/register"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('login.noAccount')} <span className="font-medium underline underline-offset-4">{t('login.register')}</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import ThemeLanguageControls from '@/components/ThemeLanguageControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth.service';
import { handleApiError } from '@/lib/utils/error';

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    access_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(formData);
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      router.push('/login');
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
      <div className="absolute top-4 right-4 z-50"><ThemeLanguageControls /></div>
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h1 className="font-display text-5xl font-bold mb-8">Zeni</h1>
          <h2 className="text-display-md mb-6">{t('login.hero.title')}<br/><span className="text-primary-200">{t('login.hero.subtitle')}</span></h2>
          <p className="text-lg text-primary-100 max-w-md leading-relaxed">{t('login.hero.description')}</p>
        </div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl opacity-20" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-4">Zeni</h1>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Criar Conta</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Registre-se para começar</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
              <div className="rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4">
                <p className="text-sm text-danger-700 dark:text-danger-400 font-medium">{error}</p>
              </div>
          )}
            <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
              />
            </div>
            <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sobrenome</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
              />
            </div>
          </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
            />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+5511999999999"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
            />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
            />
            </div>

            <div>
              <label htmlFor="access_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código de Acesso</label>
            <input
              id="access_code"
              name="access_code"
              type="text"
              required
              value={formData.access_code}
              onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-soft placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
            />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-medium hover:shadow-hard"
              >
                {loading ? 'Registrando...' : 'Registrar'}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link href="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                Já tem uma conta? Faça login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

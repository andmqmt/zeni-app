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

  const inputClass = "block w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all text-sm";

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-50"><ThemeLanguageControls /></div>

      {/* Left panel — brand hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 dark:bg-gray-50 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-white/5 dark:border-gray-900/5" />
        <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border border-white/5 dark:border-gray-900/5" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        
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

      {/* Right panel — register form */}
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Criar Conta</h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Registre-se para começar</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3.5">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Nome</label>
                <input id="first_name" name="first_name" type="text" required value={formData.first_name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Sobrenome</label>
                <input id="last_name" name="last_name" type="text" required value={formData.last_name} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="seu@email.com" className={inputClass} />
            </div>

            <div>
              <label htmlFor="phone" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Telefone</label>
              <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" className={inputClass} />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Senha</label>
              <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
            </div>

            <div>
              <label htmlFor="access_code" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Código de Acesso</label>
              <input id="access_code" name="access_code" type="text" required value={formData.access_code} onChange={handleChange} className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Já tem uma conta? <span className="font-medium underline underline-offset-4">Faça login</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

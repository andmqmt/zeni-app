'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProfile, useUpdateProfile, useInitPreferences, useUpdatePreferences } from '@/hooks/useUser';
import { handleApiError } from '@/lib/utils/error';
import { useToast } from '@/contexts/ToastContext';
import { UserPreferences } from '@/types';
import { CircleUser, Phone, Mail, Globe, Moon, Sun, Lock, ChevronRight, Landmark } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const initPreferencesMutation = useInitPreferences();
  const updatePreferencesMutation = useUpdatePreferences();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [preferencesData, setPreferencesData] = useState<UserPreferences>({
    bad_threshold: 0,
    ok_threshold: 500,
    good_threshold: 1500,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      });
      if (profile.preferences) {
        setPreferencesData(profile.preferences);
      }
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await updateProfileMutation.mutateAsync(profileData);
      toast.success('Perfil atualizado!');
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      bad_threshold: Number(preferencesData.bad_threshold),
      ok_threshold: Number(preferencesData.ok_threshold),
      good_threshold: Number(preferencesData.good_threshold),
    };

    if (isNaN(payload.bad_threshold) || isNaN(payload.ok_threshold) || isNaN(payload.good_threshold)) {
      const errorMessage = 'Todos os limites devem ser números válidos';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (payload.bad_threshold > payload.ok_threshold || payload.ok_threshold > payload.good_threshold) {
      const errorMessage = 'Os limites devem estar em ordem crescente';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    try {
      if (profile?.preferences_configured) {
        await updatePreferencesMutation.mutateAsync(payload);
      } else {
        await initPreferencesMutation.mutateAsync(payload);
      }
      toast.success('Preferências atualizadas!');
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-16">
          <Loading text="Carregando..." size="lg" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
          Configurações
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900"
        >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <CircleUser className="h-4 w-4 text-gray-500" strokeWidth={1.8} />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Informações Pessoais</h2>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Nome
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Seu primeiro nome"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Sobrenome
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Seu sobrenome"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="cursor-not-allowed opacity-50"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" strokeWidth={1.8} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                Telefone
              </label>
              <Input
                type="tel"
                required
                placeholder="(00) 00000-0000"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Balance Thresholds */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900"
        >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-900">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Preferências de Saldo</h2>
            <p className="text-xs text-gray-400 mt-0.5">Limites para classificação do saldo diário</p>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {/* Bad */}
              <div className="text-center">
                <label className="block text-[11px] font-medium text-red-400 mb-1.5 uppercase tracking-wider">
                  Ruim
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0"
                  value={preferencesData.bad_threshold}
                  onChange={(e) => setPreferencesData({ ...preferencesData, bad_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="text-center"
                />
                <div className="mt-1.5 w-full h-0.5 rounded-full bg-red-500" />
              </div>

              {/* OK */}
              <div className="text-center">
                <label className="block text-[11px] font-medium text-amber-400 mb-1.5 uppercase tracking-wider">
                  Regular
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500"
                  value={preferencesData.ok_threshold}
                  onChange={(e) => setPreferencesData({ ...preferencesData, ok_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="text-center"
                />
                <div className="mt-1.5 w-full h-0.5 rounded-full bg-amber-500" />
              </div>

              {/* Good */}
              <div className="text-center">
                <label className="block text-[11px] font-medium text-emerald-400 mb-1.5 uppercase tracking-wider">
                  Bom
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="1500"
                  value={preferencesData.good_threshold}
                  onChange={(e) => setPreferencesData({ ...preferencesData, good_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="text-center"
                />
                <div className="mt-1.5 w-full h-0.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={initPreferencesMutation.isPending || updatePreferencesMutation.isPending}
              >
                {(initPreferencesMutation.isPending || updatePreferencesMutation.isPending)
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* App Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-900">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Aparência</h2>
          </div>

          {/* Language toggle */}
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-900">
            <label className="block text-[11px] font-medium text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Idioma
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('pt-BR')}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  language === 'pt-BR'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                🇧🇷 Português
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en-US')}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  language === 'en-US'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Theme toggle — native iOS-style row */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {theme === 'dark' ? <Moon className="h-4 w-4 text-gray-500" /> : <Sun className="h-4 w-4 text-gray-500" />}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Tema</div>
                <div className="text-[11px] text-gray-400">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
          </button>
        </motion.div>
      </div>
    </PageTransition>
  );
}

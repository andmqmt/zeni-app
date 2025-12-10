'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProfile, useUpdateProfile, useInitPreferences, useUpdatePreferences } from '@/hooks/useUser';
import { handleApiError } from '@/lib/utils/error';
import { useToast } from '@/contexts/ToastContext';
import { UserPreferences } from '@/types';
import { User, Phone, Mail, Globe, Moon, Sun, Shield } from 'lucide-react';
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
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Perfil
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informações Pessoais</h2>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="cursor-not-allowed opacity-60"
                />
                <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Email não pode ser alterado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
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

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
              </Button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Preferências de Saldo
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Defina os limites para classificação do seu saldo diário
          </p>
          
          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 Os limites devem estar em ordem crescente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limite Ruim
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={preferencesData.bad_threshold}
                  onChange={(e) => setPreferencesData({ ...preferencesData, bad_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Abaixo deste valor = Ruim
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limite Regular
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500,00"
                  value={preferencesData.ok_threshold}
                  onChange={(e) => setPreferencesData({ ...preferencesData, ok_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Entre limites = Regular
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limite Bom
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="1500,00"
                  value={preferencesData.good_threshold}
                  onChange={(e) => setPreferencesData({ ...preferencesData, good_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Acima deste valor = Bom
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={initPreferencesMutation.isPending || updatePreferencesMutation.isPending}
              >
                {(initPreferencesMutation.isPending || updatePreferencesMutation.isPending)
                  ? 'Salvando...'
                  : 'Salvar Preferências'}
              </Button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Configurações
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Idioma
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('pt-BR')}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors font-medium ${
                    language === 'pt-BR'
                      ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                >
                  🇧🇷 Português
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en-US')}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors font-medium ${
                    language === 'en-US'
                      ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Tema
              </label>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-between font-medium text-gray-700 dark:text-gray-300"
              >
                <span>{theme === 'dark' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}</span>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  Alternar
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

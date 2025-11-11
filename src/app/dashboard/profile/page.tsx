'use client';

import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile, useInitPreferences, useUpdatePreferences } from '@/hooks/useUser';
import { handleApiError } from '@/lib/utils/error';
import { UserPreferences } from '@/types';
import { User, Phone, Mail, Settings, TrendingUp, TrendingDown, Minus, CheckCircle, X, Shield, Sparkles, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const initPreferencesMutation = useInitPreferences();
  const updatePreferencesMutation = useUpdatePreferences();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    auto_categorize_enabled: false,
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
        auto_categorize_enabled: profile.auto_categorize_enabled,
      });
      if (profile.preferences) {
        setPreferencesData(profile.preferences);
      }
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      await updateProfileMutation.mutateAsync(profileData);
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const payload = {
      bad_threshold: Number(preferencesData.bad_threshold),
      ok_threshold: Number(preferencesData.ok_threshold),
      good_threshold: Number(preferencesData.good_threshold),
    };

    if (isNaN(payload.bad_threshold) || isNaN(payload.ok_threshold) || isNaN(payload.good_threshold)) {
      setError('Todos os limites devem ser números válidos');
      return;
    }

    if (payload.bad_threshold > payload.ok_threshold || payload.ok_threshold > payload.good_threshold) {
      setError('Os limites devem estar em ordem crescente: Ruim ≤ Regular ≤ Bom');
      return;
    }

    try {
      if (profile?.preferences_configured) {
        await updatePreferencesMutation.mutateAsync(payload);
      } else {
        await initPreferencesMutation.mutateAsync(payload);
      }
      setSuccessMessage('Preferências atualizadas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-12 md:py-16">
          <Loading text="Carregando perfil..." size="lg" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white">
          {t('profile.title')}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-800/20 border border-danger-200 dark:border-danger-700 rounded-xl md:rounded-2xl p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-danger-500 flex items-center justify-center">
              <X className="h-3 w-3 text-white" />
            </div>
            <p className="text-sm text-danger-800 dark:text-danger-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border border-success-200 dark:border-success-700 rounded-xl md:rounded-2xl p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
            <p className="text-sm text-success-800 dark:text-success-200 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg md:text-xl font-display font-bold text-white">Informações Pessoais</h2>
          </div>
        </div>
        
        <form onSubmit={handleProfileSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome
              </label>
              <input
                type="text"
                required
                placeholder="Seu primeiro nome"
                value={profileData.first_name}
                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sobrenome
              </label>
              <input
                type="text"
                required
                placeholder="Seu sobrenome"
                value={profileData.last_name}
                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft text-gray-600 dark:text-gray-400 cursor-not-allowed text-sm md:text-base"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 md:pr-4 pointer-events-none">
                <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Email não pode ser alterado
            </p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </label>
            <input
              type="tel"
              required
              placeholder="(00) 00000-0000"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-700 rounded-lg md:rounded-xl">
            <input
              type="checkbox"
              id="auto_categorize"
              checked={profileData.auto_categorize_enabled}
              onChange={(e) => setProfileData({ ...profileData, auto_categorize_enabled: e.target.checked })}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded mt-0.5"
            />
            <label htmlFor="auto_categorize" className="flex-1">
              <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                Categorização Automática
              </div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Habilite para categorizar transações automaticamente usando IA
              </p>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all text-sm md:text-base"
            >
              {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* Balance Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold text-white">Preferências de Saldo</h2>
              <p className="text-xs md:text-sm text-white/80 mt-0.5">
                Defina os limites para classificação do seu saldo diário
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handlePreferencesSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg md:rounded-xl p-4">
            <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 font-medium">
              💡 Os limites devem estar em ordem crescente: Ruim ≤ Regular ≤ Bom
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bad Threshold */}
            <div className="bg-gradient-to-br from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-800/20 border-2 border-danger-200 dark:border-danger-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-danger-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
                <label className="text-sm md:text-base font-bold text-danger-800 dark:text-danger-200">
                  Limite Ruim
                </label>
              </div>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={preferencesData.bad_threshold}
                onChange={(e) => setPreferencesData({ ...preferencesData, bad_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-white dark:bg-gray-900 border border-danger-300 dark:border-danger-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-danger-500 dark:focus:ring-danger-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base font-semibold"
              />
              <p className="mt-2 text-xs text-danger-700 dark:text-danger-300">
                Saldo abaixo deste valor = 🔴 Ruim
              </p>
            </div>

            {/* OK Threshold */}
            <div className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 border-2 border-warning-200 dark:border-warning-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-warning-500 rounded-lg flex items-center justify-center">
                  <Minus className="h-4 w-4 text-white" />
                </div>
                <label className="text-sm md:text-base font-bold text-warning-800 dark:text-warning-200">
                  Limite Regular
                </label>
              </div>
              <input
                type="number"
                step="0.01"
                required
                placeholder="500,00"
                value={preferencesData.ok_threshold}
                onChange={(e) => setPreferencesData({ ...preferencesData, ok_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-white dark:bg-gray-900 border border-warning-300 dark:border-warning-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-warning-500 dark:focus:ring-warning-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base font-semibold"
              />
              <p className="mt-2 text-xs text-warning-700 dark:text-warning-300">
                Saldo entre limites = 🟡 Regular
              </p>
            </div>

            {/* Good Threshold */}
            <div className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border-2 border-success-200 dark:border-success-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-success-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <label className="text-sm md:text-base font-bold text-success-800 dark:text-success-200">
                  Limite Bom
                </label>
              </div>
              <input
                type="number"
                step="0.01"
                required
                placeholder="1500,00"
                value={preferencesData.good_threshold}
                onChange={(e) => setPreferencesData({ ...preferencesData, good_threshold: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-white dark:bg-gray-900 border border-success-300 dark:border-success-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-success-500 dark:focus:ring-success-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base font-semibold"
              />
              <p className="mt-2 text-xs text-success-700 dark:text-success-300">
                Saldo acima deste valor = 🟢 Bom
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={initPreferencesMutation.isPending || updatePreferencesMutation.isPending}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all text-sm md:text-base"
            >
              {(initPreferencesMutation.isPending || updatePreferencesMutation.isPending)
                ? 'Salvando...'
                : 'Salvar Preferências'}
            </button>
          </div>
        </form>
      </div>

      {/* Configurações de Aparência e Idioma */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg md:text-xl font-display font-bold text-white">{t('nav.settings')}</h2>
          </div>
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
          {/* Idioma */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('profile.language')}
            </label>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t('profile.languageDesc')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage('pt-BR')}
                className={`px-4 py-3 rounded-xl border-2 transition-all text-sm md:text-base font-semibold ${
                  language === 'pt-BR'
                    ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-soft'
                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                🇧🇷 Português
              </button>
              <button
                onClick={() => setLanguage('en-US')}
                className={`px-4 py-3 rounded-xl border-2 transition-all text-sm md:text-base font-semibold ${
                  language === 'en-US'
                    ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-soft'
                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Tema */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Tema
            </label>
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700 transition-all flex items-center justify-between text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300"
            >
              <span>{theme === 'dark' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}</span>
              <div className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                Alternar
              </div>
            </button>
          </div>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}

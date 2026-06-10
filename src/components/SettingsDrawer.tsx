'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CircleUser, Phone, Mail, Globe, Moon, Sun, Lock, ChevronRight, Power, Eye, EyeOff } from 'lucide-react';
import { useProfile, useUpdateProfile, useInitPreferences, useUpdatePreferences } from '@/hooks/useUser';
import { handleApiError } from '@/lib/utils/error';
import { useToast } from '@/contexts/ToastContext';
import { UserPreferences } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBalanceVisibility } from '@/contexts/BalanceVisibilityContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { removeToken } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const initPreferencesMutation = useInitPreferences();
  const updatePreferencesMutation = useUpdatePreferences();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isVisible, toggleVisibility } = useBalanceVisibility();
  const toast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', phone: '' });
  const [preferencesData, setPreferencesData] = useState<UserPreferences>({
    bad_threshold: 0,
    ok_threshold: 500,
    good_threshold: 1500,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({ first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone });
      if (profile.preferences) setPreferencesData(profile.preferences);
    }
  }, [profile]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync(profileData);
      toast.success('Perfil atualizado!');
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!profile?.preferences) {
        await initPreferencesMutation.mutateAsync(preferencesData);
      } else {
        await updatePreferencesMutation.mutateAsync(preferencesData);
      }
      toast.success('Preferências salvas!');
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[300] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 bottom-0 z-[301] w-full max-w-sm bg-white dark:bg-gray-950 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-900 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Configurações</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Profile */}
            <section>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Perfil</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                <form onSubmit={handleProfileSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Nome</label>
                      <Input
                        type="text"
                        required
                        placeholder="Nome"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Sobrenome</label>
                      <Input
                        type="text"
                        required
                        placeholder="Sobrenome"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Email
                    </label>
                    <div className="relative">
                      <Input type="email" disabled value={profile?.email || ''} className="cursor-not-allowed opacity-50" />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" strokeWidth={1.8} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Telefone
                    </label>
                    <Input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </div>
            </section>

            {/* Balance thresholds */}
            <section>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Preferências de Saldo</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-3">Limites para classificação do saldo diário</p>
                <form onSubmit={handlePreferencesSubmit} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <label className="block text-[11px] font-medium text-red-400 mb-1.5 uppercase tracking-wider">Ruim</label>
                      <Input
                        type="number" step="0.01" required placeholder="0"
                        value={preferencesData.bad_threshold}
                        onChange={(e) => setPreferencesData({ ...preferencesData, bad_threshold: parseFloat(e.target.value) || 0 })}
                        className="text-center"
                      />
                      <div className="mt-1.5 w-full h-0.5 rounded-full bg-red-500" />
                    </div>
                    <div className="text-center">
                      <label className="block text-[11px] font-medium text-amber-400 mb-1.5 uppercase tracking-wider">Regular</label>
                      <Input
                        type="number" step="0.01" required placeholder="500"
                        value={preferencesData.ok_threshold}
                        onChange={(e) => setPreferencesData({ ...preferencesData, ok_threshold: parseFloat(e.target.value) || 0 })}
                        className="text-center"
                      />
                      <div className="mt-1.5 w-full h-0.5 rounded-full bg-amber-500" />
                    </div>
                    <div className="text-center">
                      <label className="block text-[11px] font-medium text-emerald-400 mb-1.5 uppercase tracking-wider">Bom</label>
                      <Input
                        type="number" step="0.01" required placeholder="1500"
                        value={preferencesData.good_threshold}
                        onChange={(e) => setPreferencesData({ ...preferencesData, good_threshold: parseFloat(e.target.value) || 0 })}
                        className="text-center"
                      />
                      <div className="mt-1.5 w-full h-0.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={initPreferencesMutation.isPending || updatePreferencesMutation.isPending}>
                      {(initPreferencesMutation.isPending || updatePreferencesMutation.isPending) ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </div>
            </section>

            {/* Appearance */}
            <section>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Aparência</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {/* Visibility */}
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                      {isVisible ? <Eye className="h-4 w-4 text-gray-500" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Valores</div>
                      <div className="text-[11px] text-gray-400">{isVisible ? 'Visíveis' : 'Ocultos'}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                </button>

                {/* Theme */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                      {theme === 'dark' ? <Moon className="h-4 w-4 text-gray-500" /> : <Sun className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Tema</div>
                      <div className="text-[11px] text-gray-400">{theme === 'dark' ? 'Escuro' : 'Claro'}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                </button>

                {/* Language */}
                <div className="px-4 py-3.5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Idioma</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('pt-BR')}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        language === 'pt-BR'
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      🇧🇷 Português
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en-US')}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        language === 'en-US'
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer — logout */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-900 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <Power className="h-4 w-4" strokeWidth={1.8} />
            Sair da conta
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

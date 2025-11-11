'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Moon, Sun, Globe } from 'lucide-react';
import { useState } from 'react';

export default function ThemeLanguageControls() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          title="Idioma / Language"
        >
          <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        
        {showLangMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-hard border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            <button
              onClick={() => {
                setLanguage('pt-BR');
                setShowLangMenu(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                language === 'pt-BR'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              🇧🇷 Português
            </button>
            <button
              onClick={() => {
                setLanguage('en-US');
                setShowLangMenu(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                language === 'en-US'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              🇺🇸 English
            </button>
          </div>
        )}
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        title={theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-700" />
        )}
      </button>
    </div>
  );
}

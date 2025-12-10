'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Language = 'pt-BR' | 'en-US';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  'pt-BR': {
    'dashboard.welcome': 'Olá de volta!',
    'dashboard.title': 'Início',
  // Budget feature removed - obsolete keys kept removed
    'dashboard.dailyBalance': 'Saldo Diário',
    'dashboard.noTransactions': 'Nenhuma transação registrada neste mês',
    'dashboard.configurePref': 'Configure suas preferências',
    'dashboard.configurePrefDesc': 'Defina seus limites de saldo para visualizar melhor seus dados financeiros e receber alertas personalizados.',
    'dashboard.configureNow': 'Configurar agora →',
  // Removed other budget-related labels
  'dashboard.totalIncome': 'Total Receitas',
  'dashboard.totalExpenses': 'Total Despesas',
  'dashboard.endOfMonthBalance': 'Saldo final (prev.)',
    'status.good': 'Bom',
    'status.regular': 'Regular',
    'status.bad': 'Ruim',
    'status.notConfigured': 'Não configurado',
    'status.ok': 'OK',
  // Removed budget status
    'status.warning': 'Atenção',
    'status.nearLimit': 'Próximo do Limite',
    'status.exceeded': 'Excedido',
    'nav.home': 'Início',
    'nav.transactions': 'Transações',
  // Removed nav.budgets
    'nav.recurring': 'Recorrentes',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configurações',
    'nav.logout': 'Sair da conta',
    'login.welcome': 'Bem-vindo de volta',
    'login.subtitle': 'Entre com sua conta para continuar',
    'login.email': 'Email ou telefone',
    'login.password': 'Senha',
    'login.submit': 'Entrar',
    'login.submitting': 'Entrando...',
    'login.noAccount': 'Não tem uma conta?',
    'login.register': 'Registre-se',
    'login.hero.title': 'Controle financeiro',
    'login.hero.subtitle': 'descomplicado',
    'login.hero.description': 'Gerencie suas finanças com inteligência. Acompanhe gastos, defina metas e tome decisões financeiras mais assertivas.',
    'calendar.noData': 'Sem dados',
    'dayList.viewPast': 'Ver dias anteriores',
    'common.loading': 'Carregando...',
    'common.hideValues': 'Ocultar valores',
    'common.showValues': 'Exibir valores',
    'common.welcomeUser': 'Olá {name}, bem-vindo!',
    'transactions.title': 'Transações',
    'transactions.subtitle': 'Gerencie suas receitas e despesas',
    'transactions.new': 'Nova Transação',
    'transactions.filter': 'Filtrar',
    'transactions.noTransactions': 'Nenhuma transação encontrada',
    'transactions.createFirst': 'Crie sua primeira transação',
  // Removed budgets.* keys
    'recurring.title': 'Recorrentes',
    'recurring.subtitle': 'Automatize suas transações recorrentes',
    'recurring.new': 'Nova Recorrência',
    'recurring.materialize': 'Materializar',
    'recurring.noRecurring': 'Nenhuma recorrência cadastrada',
    'recurring.createFirst': 'Crie uma recorrência para automatizar suas transações',
    'profile.title': 'Perfil',
    'profile.subtitle': 'Gerencie suas informações e preferências',
    'profile.language': 'Idioma',
    'profile.languageDesc': 'Escolha o idioma da aplicação',
  },
  'en-US': {
    'dashboard.welcome': 'Welcome back!',
    'dashboard.title': 'Home',
  // Budget feature removed - obsolete keys removed
    'dashboard.dailyBalance': 'Daily Balance',
    'dashboard.noTransactions': 'No transactions recorded this month',
    'dashboard.configurePref': 'Configure your preferences',
    'dashboard.configurePrefDesc': 'Set your balance limits to better visualize your financial data and receive personalized alerts.',
    'dashboard.configureNow': 'Configure now →',
  // Removed other budget-related labels
  'dashboard.totalIncome': 'Total Income',
  'dashboard.totalExpenses': 'Total Expenses',
  'dashboard.endOfMonthBalance': 'End-of-Month Balance (proj.)',
    'status.good': 'Good',
    'status.regular': 'Regular',
    'status.bad': 'Bad',
    'status.notConfigured': 'Not configured',
    'status.ok': 'OK',
  // Removed budget status
    'status.warning': 'Warning',
    'status.nearLimit': 'Near Limit',
    'status.exceeded': 'Exceeded',
    'nav.home': 'Home',
    'nav.transactions': 'Transactions',
  // Removed nav.budgets
    'nav.recurring': 'Recurring',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign out',
    'login.welcome': 'Welcome back',
    'login.subtitle': 'Sign in to your account to continue',
    'login.email': 'Email or phone',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in...',
    'login.noAccount': "Don't have an account?",
    'login.register': 'Sign up',
    'login.hero.title': 'Financial control',
    'login.hero.subtitle': 'simplified',
    'login.hero.description': 'Manage your finances intelligently. Track expenses, set goals, and make smarter financial decisions.',
    'calendar.noData': 'No data',
    'dayList.viewPast': 'View previous days',
    'common.loading': 'Loading...',
    'common.hideValues': 'Hide values',
    'common.showValues': 'Show values',
    'common.welcomeUser': 'Hello {name}, welcome!',
    'transactions.title': 'Transactions',
    'transactions.subtitle': 'Manage your income and expenses',
    'transactions.new': 'New Transaction',
    'transactions.filter': 'Filter',
    'transactions.noTransactions': 'No transactions found',
    'transactions.createFirst': 'Create your first transaction',
  // Removed budgets.* keys
    'recurring.title': 'Recurring',
    'recurring.subtitle': 'Automate your recurring transactions',
    'recurring.new': 'New Recurring',
    'recurring.materialize': 'Materialize',
    'recurring.noRecurring': 'No recurring transactions',
    'recurring.createFirst': 'Create a recurring transaction to automate',
    'profile.title': 'Profile',
    'profile.subtitle': 'Manage your information and preferences',
    'profile.language': 'Language',
    'profile.languageDesc': 'Choose the application language',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback seguro para ambientes de build/prerender onde o provider ainda não está montado.
    return {
      language: 'pt-BR' as const,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}

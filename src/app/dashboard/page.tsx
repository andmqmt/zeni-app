'use client';

import { useDailyBalance, useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useUser';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Calendar from '@/components/Calendar';
import DayList from '@/components/DayList';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';
import SmartTransactionInput from '@/components/SmartTransactionInput';
import { formatISODate } from '@/lib/utils/format';

export default function DashboardPage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const { t } = useLanguage();

  // Fetch all transactions for current month to compute totals
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0);
  // Use local-date based ISO to avoid timezone shifts
  const startISO = formatISODate(monthStart);
  const endISO = formatISODate(monthEnd);
  const { data: transactions, isLoading: txLoading } = useTransactions();

  const { data: dailyBalance, isLoading: balanceLoading } = useDailyBalance({
    year: currentYear,
    month: currentMonth,
  });

  const { data: profile } = useProfile();

  const toAmount = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const monthlyTransactions = (transactions || []).filter(
    (t) => t.transaction_date >= startISO && t.transaction_date <= endISO
  );
  const totalIncome = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + toAmount(t.amount), 0);
  const totalExpense = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + toAmount(t.amount), 0);
  const endOfMonthBalance = totalIncome - totalExpense;

  if (txLoading || balanceLoading) {
    return (
      <div className="flex items-center justify-center py-16 md:py-24">
        <Loading text={t('common.loading')} size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {profile?.first_name ? t('common.welcomeUser').replace('{name}', profile.first_name) : t('dashboard.welcome')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

      {/* Removed budget related warnings */}

      {/* Smart Transaction Input */}
      <SmartTransactionInput />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-medium border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-medium">Saldo final (prev.)</span>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 rounded-lg md:rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-bold mb-1 ${endOfMonthBalance >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
            <CurrencyDisplay value={endOfMonthBalance} />
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{endOfMonthBalance >= 0 ? 'Saldo positivo projetado' : 'Atenção: saldo negativo'}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-medium border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-medium">Total Receitas</span>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-success-50 dark:bg-success-900/20 rounded-lg md:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            <CurrencyDisplay value={totalIncome} />
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Receitas acumuladas no mês</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-medium border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-medium">Total Despesas</span>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-danger-50 dark:bg-danger-900/20 rounded-lg md:rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            <CurrencyDisplay value={totalExpense} />
          </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Despesas acumuladas no mês</div>
        </div>
      </div>

      {/* Removed budgets by category section */}

      {balanceLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm md:text-base">{t('common.loading')}</div>
        </div>
      ) : dailyBalance && dailyBalance.length > 0 ? (
        <>
          <div className="hidden md:block">
            <h2 className="font-display text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">{t('dashboard.dailyBalance')}</h2>
            <Calendar year={currentYear} month={currentMonth} dailyBalances={dailyBalance} />
          </div>
          <div className="block md:hidden">
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-3">{t('dashboard.dailyBalance')}</h2>
            <DayList year={currentYear} month={currentMonth} dailyBalances={dailyBalance} />
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm md:text-base">
            {t('dashboard.noTransactions')}
          </div>
        </div>
      )}
      </div>
    </PageTransition>
  );
}

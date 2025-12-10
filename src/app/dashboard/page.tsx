'use client';

import { useState } from 'react';
import { useDailyBalance, useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useUser';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Calendar from '@/components/Calendar';
import DayList from '@/components/DayList';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';
import SmartTransactionInput from '@/components/SmartTransactionInput';
import { formatISODate } from '@/lib/utils/format';

export default function DashboardPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const { t } = useLanguage();

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0);
  const startISO = formatISODate(monthStart);
  const endISO = formatISODate(monthEnd);
  const { data: transactions, isLoading: txLoading } = useTransactions();

  const { data: dailyBalance, isLoading: balanceLoading } = useDailyBalance({
    year: selectedYear,
    month: selectedMonth,
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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleToday = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
  };

  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth() + 1;

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {profile?.first_name ? t('common.welcomeUser').replace('{name}', profile.first_name) : t('dashboard.welcome')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
              {monthNames[selectedMonth - 1]} de {selectedYear}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {monthNames.map((name, index) => (
                  <option key={index} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              
              {!isCurrentMonth && (
                <button
                  onClick={handleToday}
                  className="px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  Hoje
                </button>
              )}
            </div>
            
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
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
            <Calendar year={selectedYear} month={selectedMonth} dailyBalances={dailyBalance} />
          </div>
          <div className="block md:hidden">
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-3">{t('dashboard.dailyBalance')}</h2>
            <DayList year={selectedYear} month={selectedMonth} dailyBalances={dailyBalance} />
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

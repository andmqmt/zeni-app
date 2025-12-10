'use client';

import { useState } from 'react';
import { useDailyBalance, useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useUser';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              {profile?.first_name ? `Olá, ${profile.first_name}` : 'Dashboard'}
            </h1>
            <div className="flex items-center gap-2 group">
              <button
                onClick={handlePreviousMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
              
              <button
                onClick={handleToday}
                className={`text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${!isCurrentMonth ? 'font-medium' : ''}`}
              >
                {monthNames[selectedMonth - 1]} de {selectedYear}
              </button>
              
              <button
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

      {/* Removed budget related warnings */}

      {/* Smart Transaction Input */}
      <SmartTransactionInput />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saldo</span>
            <Wallet className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-3xl font-semibold ${endOfMonthBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            <CurrencyDisplay value={endOfMonthBalance} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receitas</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-semibold text-gray-900 dark:text-white">
            <CurrencyDisplay value={totalIncome} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Despesas</span>
            <TrendingDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-semibold text-gray-900 dark:text-white">
            <CurrencyDisplay value={totalExpense} />
          </div>
        </div>
      </div>


      {balanceLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
        </div>
      ) : dailyBalance && dailyBalance.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Calendar year={selectedYear} month={selectedMonth} dailyBalances={dailyBalance} />
          </div>
          <div className="block md:hidden">
            <DayList year={selectedYear} month={selectedMonth} dailyBalances={dailyBalance} />
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            {t('dashboard.noTransactions')}
          </div>
        </div>
      )}
      </div>
    </PageTransition>
  );
}

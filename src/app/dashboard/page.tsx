'use client';

import { useState, useMemo } from 'react';
import { useDailyBalance } from '@/hooks/useTransactions';
import { useTransactionsWithPreview } from '@/hooks/useTransactionsWithPreview';
import { useProfile } from '@/hooks/useUser';
import { usePreviewTransactions } from '@/contexts/PreviewTransactionContext';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Calendar from '@/components/Calendar';
import DayList from '@/components/DayList';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';
import { formatISODate } from '@/lib/utils/format';
import { combineDailyBalancesWithPreviews } from '@/lib/utils/dailyBalanceWithPreview';

export default function DashboardPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const { t } = useLanguage();

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0);
  const startISO = formatISODate(monthStart);
  const endISO = formatISODate(monthEnd);
  const { data: transactions, isLoading: txLoading } = useTransactionsWithPreview();
  const { previewTransactions } = usePreviewTransactions();

  const { data: backendDailyBalance, isLoading: balanceLoading } = useDailyBalance({
    year: selectedYear,
    month: selectedMonth,
  });

  const { data: profile } = useProfile();

  const dailyBalance = useMemo(() => {
    if (!backendDailyBalance) return [];
    return combineDailyBalancesWithPreviews(
      backendDailyBalance,
      previewTransactions,
      selectedYear,
      selectedMonth,
      profile?.preferences
    );
  }, [backendDailyBalance, previewTransactions, selectedYear, selectedMonth, profile?.preferences]);

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
      <div className="flex items-center justify-center py-20">
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header — greeting + month nav */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {profile?.first_name ? `${getGreeting()}, ${profile.first_name}` : 'Dashboard'}
          </h1>
          <div className="flex items-center gap-1 mt-1.5">
            <button
              onClick={handlePreviousMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={handleToday}
              className={`text-sm px-2 py-0.5 rounded-md transition-colors ${
                isCurrentMonth
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-900'
              }`}
            >
              {monthNames[selectedMonth - 1]} {selectedYear}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Summary cards — clean, borderless, with subtle background */}
        <div className="grid grid-cols-3 gap-3">
          {/* Balance */}
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-900">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saldo</span>
            </div>
            <div className={`text-xl md:text-2xl font-semibold tracking-tight ${endOfMonthBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              <CurrencyDisplay value={endOfMonthBalance} />
            </div>
          </div>

          {/* Income */}
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-900">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entradas</span>
            </div>
            <div className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              <CurrencyDisplay value={totalIncome} />
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-900">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saídas</span>
            </div>
            <div className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              <CurrencyDisplay value={totalExpense} />
            </div>
          </div>
        </div>

        {/* Daily balance — Calendar (desktop) / DayList (mobile) */}
        {balanceLoading ? (
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-8 border border-gray-100 dark:border-gray-900">
            <div className="text-center text-gray-400">{t('common.loading')}</div>
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
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-10 border border-gray-100 dark:border-gray-900">
            <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
              {t('dashboard.noTransactions')}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

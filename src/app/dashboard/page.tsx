'use client';

import { useState, useMemo } from 'react';
import { useDailyBalance } from '@/hooks/useTransactions';
import { useTransactionsWithPreview } from '@/hooks/useTransactionsWithPreview';
import { useProfile } from '@/hooks/useUser';
import { usePreviewTransactions } from '@/contexts/PreviewTransactionContext';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { TrendingUp, TrendingDown, PiggyBank, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {profile?.first_name ? `${getGreeting()}, ${profile.first_name}` : 'Dashboard'}
          </h1>
          <div className="flex items-center gap-1 mt-1.5">
            <button
              onClick={handlePreviousMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-400" strokeWidth={2} />
            </button>
            <button
              onClick={handleToday}
              className={`text-sm px-2.5 py-0.5 rounded-lg transition-colors ${
                isCurrentMonth
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-900'
              }`}
            >
              {monthNames[selectedMonth - 1]} {selectedYear}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* === MOBILE SUMMARY === */}
        <div className="md:hidden space-y-3">
          {/* Hero balance + progress */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-50 dark:to-white rounded-2xl p-5 relative overflow-hidden">
            {/* Decorative ring */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full border border-white/5 dark:border-gray-900/5" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border border-white/5 dark:border-gray-900/5" />
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <PiggyBank className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" strokeWidth={1.8} />
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Saldo do mês</span>
              </div>
              <div className={`text-3xl font-bold tracking-tight font-display ${
                endOfMonthBalance >= 0 ? 'text-white dark:text-gray-900' : 'text-red-400 dark:text-red-600'
              }`}>
                <CurrencyDisplay value={endOfMonthBalance} />
              </div>
              {/* Mini progress bar */}
              {totalIncome > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 dark:bg-gray-900/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 dark:bg-emerald-600 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((endOfMonthBalance / totalIncome) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums font-medium">
                    {totalIncome > 0 ? Math.round((endOfMonthBalance / totalIncome) * 100) : 0}%
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Income / Expense mini cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Entradas</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
                <CurrencyDisplay value={totalIncome} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Saídas</span>
                <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 text-red-500" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
                <CurrencyDisplay value={totalExpense} />
              </div>
            </div>
          </div>
        </div>

        {/* === DESKTOP SUMMARY === */}
        <div className="hidden md:grid md:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-100 dark:border-gray-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Saldo</span>
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <PiggyBank className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.8} />
              </div>
            </div>
            <div className={`text-2xl font-bold tracking-tight tabular-nums ${endOfMonthBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              <CurrencyDisplay value={endOfMonthBalance} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-100 dark:border-gray-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Entradas</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
              <CurrencyDisplay value={totalIncome} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-100 dark:border-gray-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Saídas</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
              <CurrencyDisplay value={totalExpense} />
            </div>
          </div>
        </div>

        {/* Daily balance */}
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

'use client';

import { useState, useMemo } from 'react';
import { useDailyBalance } from '@/hooks/useTransactions';
import { useTransactionsWithPreview } from '@/hooks/useTransactionsWithPreview';
import { useProfile } from '@/hooks/useUser';
import { usePreviewTransactions } from '@/contexts/PreviewTransactionContext';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { TrendingUp, TrendingDown, PiggyBank, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import MonthPicker from '@/components/ui/MonthPicker';
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {profile?.first_name ? `${getGreeting()}, ${profile.first_name}` : 'Dashboard'}
          </h1>
          <div className="w-full sm:w-[220px]">
            <MonthPicker
              value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
              onChange={(val) => {
                const [y, m] = val.split('-');
                setSelectedYear(parseInt(y));
                setSelectedMonth(parseInt(m));
              }}
            />
          </div>
        </div>

        {/* Hero & Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hero balance + progress */}
          <div className="lg:col-span-2 bg-gray-900 dark:bg-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            {/* Decorative ring */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full border border-white/5 dark:border-gray-900/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full border border-white/5 dark:border-gray-900/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.8} />
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Saldo do mês</span>
              </div>
              <div className={`text-4xl font-bold tracking-tight font-display ${
                endOfMonthBalance >= 0 ? 'text-white dark:text-gray-900' : 'text-red-400 dark:text-red-600'
              }`}>
                <CurrencyDisplay value={endOfMonthBalance} />
              </div>
            </div>
            
            {/* Progress bar */}
            {totalIncome > 0 && (
              <div className="relative z-10 mt-6 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 dark:bg-gray-900/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((endOfMonthBalance / totalIncome) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums font-semibold">
                  {totalIncome > 0 ? Math.round((endOfMonthBalance / totalIncome) * 100) : 0}%
                </span>
              </div>
            )}
          </div>

          {/* Income / Expense mini cards */}
          <div className="lg:col-span-1 flex flex-row lg:flex-col gap-4">
            <div className="flex-1 bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Entradas</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums mt-1">
                <CurrencyDisplay value={totalIncome} />
              </div>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Saídas</span>
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums mt-1">
                <CurrencyDisplay value={totalExpense} />
              </div>
            </div>
          </div>
        </div>

        {/* Daily balance prominently displayed using DayList exclusively to match bank aesthetics */}
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight mb-4 px-1">
            SALDO DIÁRIO
          </h2>
          {balanceLoading ? (
            <div className="bg-white dark:bg-gray-950 rounded-2xl p-10 border border-gray-200 dark:border-gray-800">
              <div className="text-center text-gray-400 flex flex-col items-center justify-center">
                 <Loading text={t('common.loading')} size="md" />
              </div>
            </div>
          ) : dailyBalance && dailyBalance.length > 0 ? (
            <DayList year={selectedYear} month={selectedMonth} dailyBalances={dailyBalance} />
          ) : (
            <div className="bg-white dark:bg-gray-950 rounded-2xl p-10 border border-gray-200 dark:border-gray-800">
              <div className="text-center font-medium text-gray-400 dark:text-gray-500 text-sm">
                Nenhuma transação neste mês. Ajuste o filtro acima.
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

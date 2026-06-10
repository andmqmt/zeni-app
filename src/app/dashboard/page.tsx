'use client';

import { useState, useMemo } from 'react';
import { useDailyBalance } from '@/hooks/useTransactions';
import { useTransactionsWithPreview } from '@/hooks/useTransactionsWithPreview';
import { useProfile } from '@/hooks/useUser';
import { usePreviewTransactions } from '@/contexts/PreviewTransactionContext';
import { useBalanceVisibility } from '@/contexts/BalanceVisibilityContext';
import { useTheme } from '@/contexts/ThemeContext';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { PiggyBank, ArrowUpRight, ArrowDownLeft, Settings, Sun, Moon, Eye, EyeOff, ExternalLink, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import MonthPicker from '@/components/ui/MonthPicker';
import DayList from '@/components/DayList';
import Calendar from '@/components/Calendar';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';
import { formatISODate } from '@/lib/utils/format';
import { combineDailyBalancesWithPreviews } from '@/lib/utils/dailyBalanceWithPreview';
import SettingsDrawer from '@/components/SettingsDrawer';
import Link from 'next/link';
import FloatingTransactionButton from '@/components/FloatingTransactionButton';

export default function DashboardPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTxOpen, setNewTxOpen] = useState(false);
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isVisible, toggleVisibility } = useBalanceVisibility();

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0);
  const startISO = formatISODate(monthStart);
  const endISO = formatISODate(monthEnd);

  const { data: transactions, isLoading: txLoading } = useTransactionsWithPreview();
  const { previewTransactions } = usePreviewTransactions();
  const { data: backendDailyBalance, isLoading: balanceLoading } = useDailyBalance({ year: selectedYear, month: selectedMonth });
  const { data: profile } = useProfile();

  const dailyBalance = useMemo(() => {
    if (!backendDailyBalance) return [];
    return combineDailyBalancesWithPreviews(backendDailyBalance, previewTransactions, selectedYear, selectedMonth, profile?.preferences);
  }, [backendDailyBalance, previewTransactions, selectedYear, selectedMonth, profile?.preferences]);

  const toAmount = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') { const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) ? n : 0; }
    return 0;
  };

  const monthlyTransactions = (transactions || []).filter(
    (tx) => tx.transaction_date >= startISO && tx.transaction_date <= endISO
  );
  const totalIncome = monthlyTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + toAmount(tx.amount), 0);
  const totalExpense = monthlyTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + toAmount(tx.amount), 0);
  const endOfMonthBalance = totalIncome - totalExpense;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Bom dia';
    if (h >= 12 && h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (txLoading || balanceLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading text={t('common.loading')} size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          {/* Brand + greeting */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center">
                <span className="text-white dark:text-gray-900 text-[10px] font-bold">Z</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">Zeni</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {profile?.first_name ? `${getGreeting()}, ${profile.first_name}` : getGreeting()}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Nova transação — desktop only */}
            <button
              onClick={() => setNewTxOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Nova transação
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleVisibility}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                title={isVisible ? 'Ocultar valores' : 'Mostrar valores'}
              >
                {isVisible
                  ? <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  : <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
              </button>
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                {theme === 'dark'
                  ? <Sun className="w-4 h-4 text-gray-400" />
                  : <Moon className="w-4 h-4 text-gray-500" />}
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                aria-label="Configurações"
              >
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Month picker ── */}
        <MonthPicker
          value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
          onChange={(val) => {
            const [y, m] = val.split('-');
            setSelectedYear(parseInt(y));
            setSelectedMonth(parseInt(m));
          }}
        />

        {/* ── Hero balance card ── */}
        <div className="bg-gray-900 dark:bg-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[156px]">
          {/* Decorative rings */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-white/5 dark:border-gray-900/5" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full border border-white/5 dark:border-gray-900/5" />

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
                {Math.round((endOfMonthBalance / totalIncome) * 100)}%
              </span>
            </div>
          )}

          {/* Ver extrato — link minimalista */}
          <div className="relative z-10 mt-4 flex justify-end">
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 transition-colors group"
            >
              ver extrato
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* ── Income / Expense summary ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-900 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Entradas</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
              <CurrencyDisplay value={totalIncome} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-900 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Saídas</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
              <CurrencyDisplay value={totalExpense} />
            </div>
          </div>
        </div>

        {/* ── Daily balance (calendar/daylist) ── */}
        <div>
          <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-0.5">
            Saldo Diário
          </h2>
          {balanceLoading ? (
            <div className="bg-white dark:bg-gray-950 rounded-2xl p-10 border border-gray-100 dark:border-gray-900 flex justify-center">
              <Loading text={t('common.loading')} size="md" />
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
            <div className="bg-white dark:bg-gray-950 rounded-2xl p-10 border border-gray-100 dark:border-gray-900 text-center text-sm text-gray-400 dark:text-gray-500 font-medium">
              Nenhuma transação neste mês.
            </div>
          )}
        </div>

      </div>

      {/* Desktop "nova transação" button */}
      <FloatingTransactionButton isOpenExternal={newTxOpen} onCloseExternal={() => setNewTxOpen(false)} />

      {/* Settings drawer */}
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </PageTransition>
  );
}

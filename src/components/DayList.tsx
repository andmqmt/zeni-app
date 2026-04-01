'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DailyBalance } from '@/types';
import { formatCurrency, formatISODate } from '@/lib/utils/format';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DayListProps {
  year: number;
  month: number;
  dailyBalances: DailyBalance[];
}

export default function DayList({ year, month, dailyBalances }: DayListProps) {
  const [showPastDays, setShowPastDays] = useState(false);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const { t } = useLanguage();
  const router = useRouter();

  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, month - 1, day);
    const dateStr = formatISODate(date);
    const balance = dailyBalances.find(b => b.date === dateStr);
    const isToday = isCurrentMonth && today.getDate() === day;
    const isPast = date < today && !isToday;

    return { day, date, balance, isToday, isPast, dateStr };
  });

  const futureDays = allDays.filter(d => !d.isPast);
  const pastDays = allDays.filter(d => d.isPast);
  const days = showPastDays ? [...pastDays, ...futureDays] : futureDays;

  const weekDayShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const statusDot = (status: string) => {
    switch (status) {
      case 'green': return 'bg-emerald-500';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-amber-500';
      default: return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  const handleDayClick = (dateStr: string, hasBalance: boolean) => {
    if (hasBalance) {
      router.push(`/dashboard/transactions?date=${dateStr}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 overflow-hidden">
      {/* Show past days toggle */}
      {!showPastDays && pastDays.length > 0 && (
        <button
          onClick={() => setShowPastDays(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-100 dark:border-gray-900"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          <span>{t('dayList.viewPast')} ({pastDays.length})</span>
        </button>
      )}

      {/* Day rows */}
      <div className="divide-y divide-gray-50 dark:divide-gray-900">
        {days.map(({ day, date, balance, isToday, dateStr }) => {
          const hasBalance = !!balance;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(dateStr, hasBalance)}
              disabled={!hasBalance}
              className={`group w-full px-5 py-4 flex items-center justify-between transition-all text-left ${
                isToday
                  ? 'bg-gray-50 dark:bg-gray-900/40'
                  : hasBalance
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-900/60 cursor-pointer'
                    : 'opacity-50'
              }`}
            >
              <div className="flex items-center gap-4 transition-transform group-hover:translate-x-1">
                {/* Day badge — compact */}
                <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl shadow-sm transition-colors ${
                  isToday
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:text-gray-900 dark:group-hover:text-white group-hover:shadow-md'
                }`}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-80">
                    {weekDayShort[date.getDay()]}
                  </div>
                  <div className="text-base font-bold leading-none">
                    {day}
                  </div>
                </div>

                {/* Status info */}
                <div>
                  {balance ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusDot(balance.status || '')} shadow-sm`} />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {balance.status === 'green' ? t('status.good') :
                         balance.status === 'yellow' ? t('status.regular') :
                         balance.status === 'red' ? t('status.bad') : t('status.notConfigured')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{t('calendar.noData')}</span>
                  )}
                </div>
              </div>

              {/* Balance value */}
              {balance && (
                <div className="flex items-center gap-3">
                   <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
                     {formatCurrency(balance.balance)}
                   </div>
                   <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 hidden sm:flex">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                   </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-900">
        <div className="flex items-center justify-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-gray-400">{t('status.bad')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-gray-400">{t('status.regular')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-gray-400">{t('status.good')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { DailyBalance } from '@/types';
import { formatCurrency, formatISODate } from '@/lib/utils/format';
import { getDaysInMonth, getBalanceForDate, isSameMonth, isToday } from '@/lib/utils/calendar';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalendarProps {
  year: number;
  month: number;
  dailyBalances: DailyBalance[];
}

export default function Calendar({ year, month, dailyBalances }: CalendarProps) {
  const days = getDaysInMonth(year, month);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const { t } = useLanguage();
  const router = useRouter();

  const handleDayClick = (date: Date, balance: DailyBalance | null) => {
    if (balance && isSameMonth(date, month)) {
      const dateStr = formatISODate(date);
      router.push(`/dashboard/transactions?date=${dateStr}`);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-emerald-500';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-amber-500';
      default: return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 p-5">
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider py-2">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          const balance = getBalanceForDate(date, dailyBalances);
          const isCurrentMonth = isSameMonth(date, month);
          const isTodayDate = isToday(date);
          const hasBalance = balance && isCurrentMonth;

          return (
            <button
              key={index}
              onClick={() => handleDayClick(date, balance)}
              disabled={!hasBalance}
              className={`min-h-[76px] p-2.5 rounded-xl transition-all text-left ${
                isCurrentMonth
                  ? hasBalance
                    ? 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                    : 'bg-transparent'
                  : 'opacity-25'
              } ${isTodayDate ? 'ring-2 ring-gray-900 dark:ring-gray-200 ring-offset-1 dark:ring-offset-gray-950' : ''}`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-xs mb-1.5 ${
                  isTodayDate ? 'text-gray-900 dark:text-white font-bold' : isCurrentMonth ? 'text-gray-500 dark:text-gray-400 font-medium' : 'text-gray-300 dark:text-gray-700'
                }`}>
                  {date.getDate()}
                </div>

                {balance && isCurrentMonth && (
                  <>
                    <div className={`w-full h-0.5 rounded-full mb-1.5 ${statusColor(balance.status)}`} />
                    <div className="text-[11px] font-semibold text-gray-900 dark:text-white truncate mt-auto leading-tight" title={formatCurrency(balance.balance)}>
                      {formatCurrency(balance.balance)}
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend — minimal */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-900 flex items-center justify-center gap-5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full bg-red-500" />
          <span className="text-gray-400">{t('status.bad')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full bg-amber-500" />
          <span className="text-gray-400">{t('status.regular')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full bg-emerald-500" />
          <span className="text-gray-400">{t('status.good')}</span>
        </div>
      </div>
    </div>
  );
}

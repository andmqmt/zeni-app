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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium text-gray-500 dark:text-gray-400 text-xs uppercase py-2">
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
              className={`min-h-[80px] p-3 rounded-lg border transition-all ${
                isCurrentMonth
                  ? hasBalance
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                  : 'border-transparent bg-gray-50 dark:bg-gray-800/30 opacity-40'
              } ${isTodayDate ? 'ring-2 ring-gray-900 dark:ring-gray-100' : ''}`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm font-medium mb-2 ${
                  isTodayDate ? 'text-gray-900 dark:text-white font-semibold' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {date.getDate()}
                </div>

                {balance && isCurrentMonth && (
                  <>
                    <div 
                      className={`w-full h-1 rounded-full mb-2 flex-shrink-0 ${
                        balance.status === 'green' ? 'bg-green-500 dark:bg-green-400' 
                          : balance.status === 'red' ? 'bg-red-500 dark:bg-red-400' 
                          : balance.status === 'yellow' ? 'bg-yellow-500 dark:bg-yellow-400' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    ></div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white truncate mt-auto" title={formatCurrency(balance.balance)}>
                      {formatCurrency(balance.balance)}
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full bg-red-500 dark:bg-red-400"></div>
          <span className="text-gray-600 dark:text-gray-400">{t('status.bad')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full bg-yellow-500 dark:bg-yellow-400"></div>
          <span className="text-gray-600 dark:text-gray-400">{t('status.regular')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full bg-green-500 dark:bg-green-400"></div>
          <span className="text-gray-600 dark:text-gray-400">{t('status.good')}</span>
        </div>
      </div>
    </div>
  );
}

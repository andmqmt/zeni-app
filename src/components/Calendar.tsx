'use client';

import { DailyBalance } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { getBalanceStatusColor } from '@/lib/utils/status';
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-6">
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide py-2">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          const balance = getBalanceForDate(date, dailyBalances);
          const isCurrentMonth = isSameMonth(date, month);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`min-h-[90px] p-3 rounded-xl border-2 transition-all ${
                isCurrentMonth
                  ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:shadow-medium hover:border-primary-200 dark:hover:border-primary-600'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-30'
              } ${isTodayDate ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-soft' : ''}`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm font-bold mb-2 ${
                  isTodayDate ? 'text-primary-600 dark:text-primary-400' : isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {date.getDate()}
                </div>

                {balance && isCurrentMonth && (
                  <>
                    <div 
                      className="w-full h-1.5 rounded-full mb-2 flex-shrink-0"
                      style={{ 
                        backgroundColor: balance.status === 'green' ? '#22c55e' 
                          : balance.status === 'red' ? '#ef4444' 
                          : balance.status === 'yellow' ? '#eab308' 
                          : '#9ca3af' 
                      }}
                    ></div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate mt-auto" title={formatCurrency(balance.balance)}>
                      {formatCurrency(balance.balance)}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-1.5 rounded-full bg-danger-500"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">{t('status.bad')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-1.5 rounded-full bg-warning-500"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">{t('status.regular')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-1.5 rounded-full bg-success-500"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">{t('status.good')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-1.5 rounded-full bg-gray-400"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">{t('status.notConfigured')}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { DailyBalance } from '@/types';
import { formatCurrency, formatISODate } from '@/lib/utils/format';
import { getBalanceStatusColor } from '@/lib/utils/status';
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

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
      {!showPastDays && pastDays.length > 0 && (
        <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={() => setShowPastDays(true)}
            className="w-full flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3.5 bg-white dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-lg md:rounded-xl transition-all shadow-soft hover:shadow-medium border border-gray-200 dark:border-gray-600 hover:border-primary-200 dark:hover:border-primary-700 font-semibold text-sm md:text-base"
          >
            <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
            <span>{t('dayList.viewPast')} ({pastDays.length})</span>
          </button>
        </div>
      )}
      
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {days.map(({ day, date, balance, isToday }) => (
          <div
            key={day}
            className={`p-3 md:p-4 flex items-center justify-between transition-all ${
              isToday ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600 dark:border-primary-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl transition-all ${
                isToday ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-medium' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                <div className="text-xs font-semibold uppercase">
                  {weekDayNames[date.getDay()]}
                </div>
                <div className="text-lg md:text-xl font-bold">
                  {day}
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </div>
                {balance && (
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
                        balance.status === 'green' ? 'bg-success-500' 
                          : balance.status === 'red' ? 'bg-danger-500' 
                          : balance.status === 'yellow' ? 'bg-warning-500' 
                          : 'bg-gray-400 dark:bg-gray-500'
                      }`}
                    ></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {balance.status === 'green' ? t('status.good') : 
                       balance.status === 'yellow' ? t('status.regular') : 
                       balance.status === 'red' ? t('status.bad') : t('status.notConfigured')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {balance ? (
              <div className="text-right">
                <div 
                  className={`text-base md:text-xl font-bold ${
                    balance.status === 'green' ? 'text-success-600 dark:text-success-400' 
                      : balance.status === 'red' ? 'text-danger-600 dark:text-danger-400' 
                      : balance.status === 'yellow' ? 'text-warning-600 dark:text-warning-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {formatCurrency(balance.balance)}
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-xs md:text-sm text-gray-400 dark:text-gray-500 font-medium">
                  {t('calendar.noData')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-around text-xs">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-danger-500"></div>
            <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">{t('status.bad')}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-warning-500"></div>
            <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">{t('status.regular')}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-success-500"></div>
            <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">{t('status.good')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

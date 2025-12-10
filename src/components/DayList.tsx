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

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleDayClick = (dateStr: string, hasBalance: boolean) => {
    if (hasBalance) {
      router.push(`/dashboard/transactions?date=${dateStr}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {!showPastDays && pastDays.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowPastDays(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 font-medium"
          >
            <ChevronDown className="h-4 w-4" />
            <span>{t('dayList.viewPast')} ({pastDays.length})</span>
          </button>
        </div>
      )}
      
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {days.map(({ day, date, balance, isToday, dateStr }) => {
          const hasBalance = !!balance;
          
          return (
            <button
              key={day}
              onClick={() => handleDayClick(dateStr, hasBalance)}
              disabled={!hasBalance}
              className={`w-full p-4 flex items-center justify-between transition-colors text-left ${
                isToday ? 'bg-gray-50 dark:bg-gray-800 border-l-2 border-gray-900 dark:border-gray-100' : hasBalance ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                  isToday ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}>
                  <div className="text-xs font-medium uppercase">
                    {weekDayNames[date.getDay()]}
                  </div>
                  <div className="text-lg font-semibold">
                    {day}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </div>
                  {balance && (
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          balance.status === 'green' ? 'bg-green-500 dark:bg-green-400' 
                            : balance.status === 'red' ? 'bg-red-500 dark:bg-red-400' 
                            : balance.status === 'yellow' ? 'bg-yellow-500 dark:bg-yellow-400' 
                            : 'bg-gray-400 dark:bg-gray-500'
                        }`}
                      ></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
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
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(balance.balance)}
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {t('calendar.noData')}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-around text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('status.bad')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 dark:bg-yellow-400"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('status.regular')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('status.good')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

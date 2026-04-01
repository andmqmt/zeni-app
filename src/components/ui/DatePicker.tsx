'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatISODate, parseDateStringToLocal } from '@/lib/utils/format';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function DatePicker({ value, onChange, className = '', placeholder = 'Selecione uma data' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? parseDateStringToLocal(value) : new Date();
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  const selectedDate = value ? parseDateStringToLocal(value) : null;
  const displayValue = selectedDate
    ? `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`
    : placeholder;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date: Date) => selectedDate ? date.toDateString() === selectedDate.toDateString() : false;

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.year, currentMonth.month, day);
    onChange(formatISODate(newDate));
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      if (direction === 'prev') {
        return prev.month === 0
          ? { year: prev.year - 1, month: 11 }
          : { year: prev.year, month: prev.month - 1 };
      }
      return prev.month === 11
        ? { year: prev.year + 1, month: 0 }
        : { year: prev.year, month: prev.month + 1 };
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() });
    onChange(formatISODate(today));
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const days: (number | null)[] = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {/* Trigger — matches Input component styling */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all flex items-center gap-2.5"
      >
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" strokeWidth={1.8} />
        <span className={selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}>
          {displayValue}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — mobile fullscreen */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] md:hidden"
              onClick={() => setIsOpen(false)}
            />
            {/* Calendar panel */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed md:absolute z-[101] flex flex-col bg-white dark:bg-gray-950 rounded-t-2xl md:rounded-xl shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 p-5 md:p-4 w-full md:w-[300px] bottom-0 md:bottom-auto left-0 md:left-auto md:right-0 md:mt-2 max-h-[85dvh] md:max-h-none overflow-y-auto pb-10 md:pb-4"
              style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
            >
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="w-8 h-8 md:w-7 md:h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {months[currentMonth.month]} {currentMonth.year}
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="w-8 h-8 md:w-7 md:h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {weekDays.map((day) => (
                  <div key={day} className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 text-center py-1.5 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, index) => {
                  if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;
                  const date = new Date(currentMonth.year, currentMonth.month, day);
                  const today = isToday(date);
                  const selected = isSelected(date);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] md:min-h-0 flex items-center justify-center ${
                        selected
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold'
                          : today
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold ring-1 ring-gray-300 dark:ring-gray-600'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Today shortcut */}
              <button
                type="button"
                onClick={goToToday}
                className="w-full mt-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 rounded-xl transition-colors touch-manipulation border border-gray-200 dark:border-gray-800"
              >
                Hoje
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

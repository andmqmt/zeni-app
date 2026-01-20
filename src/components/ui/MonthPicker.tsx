'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  value: string;
  onChange: (month: string) => void;
  className?: string;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => {
    if (value) {
      const [year] = value.split('-');
      return parseInt(year);
    }
    return new Date().getFullYear();
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null;
  const displayValue = value
    ? `${months[selectedMonth || 0]} ${value.split('-')[0]}`
    : 'Selecione um mês';

  const handleMonthSelect = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    onChange(`${currentYear}-${monthStr}`);
    setIsOpen(false);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentYear((prev) => prev + (direction === 'next' ? 1 : -1));
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    onChange(`${today.getFullYear()}-${monthStr}`);
    setIsOpen(false);
  };

  const currentDate = new Date();
  const isCurrentYear = currentYear === currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all flex items-center gap-2"
      >
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
          {displayValue}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed md:absolute z-50 mt-0 md:mt-2 bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-xl shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 p-4 md:p-4 w-full md:w-[280px] bottom-0 md:bottom-auto left-0 md:left-auto md:right-0 max-h-[80vh] md:max-h-none overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateYear('prev')}
                  className="p-2 md:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Ano anterior"
                >
                  <ChevronLeft className="w-5 h-5 md:w-4 md:h-4 text-gray-700 dark:text-gray-300" />
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-sm">
                  {currentYear}
                </h3>
                <button
                  type="button"
                  onClick={() => navigateYear('next')}
                  className="p-2 md:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Próximo ano"
                >
                  <ChevronRight className="w-5 h-5 md:w-4 md:h-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-1.5">
                {months.map((month, index) => {
                  const isSelected = selectedMonth === index && value?.startsWith(`${currentYear}-`);
                  const isCurrent = isCurrentYear && index === currentMonth;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMonthSelect(index)}
                      className={`px-3 md:px-2 py-2.5 md:py-2 rounded-lg text-sm md:text-xs font-medium transition-all touch-manipulation ${
                        isSelected
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                          : isCurrent
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700'
                      }`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={goToCurrentMonth}
                className="w-full mt-4 md:mt-3 px-4 md:px-3 py-3 md:py-2 text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors touch-manipulation"
              >
                Mês Atual
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

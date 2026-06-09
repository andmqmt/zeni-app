'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => {
    if (value) {
      const [year] = value.split('-');
      return parseInt(year);
    }
    return new Date().getFullYear();
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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
  const currentMonthIdx = currentDate.getMonth();

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {/* Trigger — matches Input component styling */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all flex items-center gap-2.5"
      >
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" strokeWidth={1.8} />
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}>
          {displayValue}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          isMobile && mounted ? (
            <>
              {createPortal(
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] md:hidden"
                  onClick={() => setIsOpen(false)}
                />,
                document.body
              )}
              {createPortal(
                <motion.div
                  key="panel"
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="fixed z-[101] flex flex-col bg-white dark:bg-gray-950 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-800 p-5 w-full bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto pb-10"
                  style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
                >
                  {/* Year nav */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => navigateYear('prev')}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                      aria-label="Ano anterior"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currentYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateYear('next')}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                      aria-label="Próximo ano"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                    </button>
                  </div>

                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {months.map((month, index) => {
                      const isSelected = selectedMonth === index && value?.startsWith(`${currentYear}-`);
                      const isCurrent = isCurrentYear && index === currentMonthIdx;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleMonthSelect(index)}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                            isSelected
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold'
                              : isCurrent
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold ring-1 ring-gray-300 dark:ring-gray-600'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800'
                          }`}
                        >
                          {month.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Current month shortcut */}
                  <button
                    type="button"
                    onClick={goToCurrentMonth}
                    className="w-full mt-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 rounded-xl transition-colors touch-manipulation border border-gray-200 dark:border-gray-800"
                  >
                    Mês Atual
                  </button>
                </motion.div>,
                document.body
              )}
            </>
          ) : (
            <motion.div
              key="panel-desktop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute z-[101] flex flex-col bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 w-[300px] mt-2 right-0"
            >
              {/* Year nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateYear('prev')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Ano anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentYear}
                </span>
                <button
                  type="button"
                  onClick={() => navigateYear('next')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Próximo ano"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                </button>
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {months.map((month, index) => {
                  const isSelected = selectedMonth === index && value?.startsWith(`${currentYear}-`);
                  const isCurrent = isCurrentYear && index === currentMonthIdx;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMonthSelect(index)}
                      className={`px-3 py-2 rounded-lg text-sm md:text-xs font-medium transition-all touch-manipulation ${
                        isSelected
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold'
                          : isCurrent
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold ring-1 ring-gray-300 dark:ring-gray-600'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800'
                      }`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  );
                })}
              </div>

              {/* Current month shortcut */}
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="w-full mt-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 rounded-xl transition-colors touch-manipulation border border-gray-200 dark:border-gray-800"
              >
                Mês Atual
              </button>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

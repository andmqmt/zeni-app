'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatISODate, parseDateStringToLocal } from '@/lib/utils/format';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function DatePicker({
  value,
  onChange,
  className = '',
  placeholder = 'Selecione uma data',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? parseDateStringToLocal(value) : new Date();
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Position desktop dropdown via portal
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const panelHeight = 340;
    const top = spaceBelow >= panelHeight
      ? rect.bottom + 6
      : rect.top - panelHeight - 6;
    setDropdownPos({
      top,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (isOpen && !isMobile) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, isMobile, updatePosition]);

  // Close on click outside (desktop portal)
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const panel = document.getElementById('datepicker-panel');
      const trigger = triggerRef.current;
      if (panel && !panel.contains(target) && trigger && !trigger.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const selectedDate = value ? parseDateStringToLocal(value) : null;
  const displayValue = selectedDate
    ? `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${selectedDate.getFullYear()}`
    : placeholder;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date: Date) =>
    selectedDate ? date.toDateString() === selectedDate.toDateString() : false;

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
  const days: (number | null)[] = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  // Shared calendar content
  const CalendarContent = ({ compact = false }: { compact?: boolean }) => (
    <>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {months[currentMonth.month]} {currentMonth.year}
        </span>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 text-center py-1 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;
          const date = new Date(currentMonth.year, currentMonth.month, day);
          const todayDate = isToday(date);
          const selected = isSelected(date);
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateSelect(day)}
              className={`aspect-square rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center ${
                compact ? 'min-h-[36px]' : 'min-h-[44px]'
              } ${
                selected
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold'
                  : todayDate
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
    </>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all flex items-center gap-2.5"
      >
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" strokeWidth={1.8} />
        <span className={selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}>
          {displayValue}
        </span>
      </button>

      {mounted && (
        <AnimatePresence>
          {isOpen && (
            isMobile ? (
              // ── MOBILE: bottom sheet via portal ──
              <>
                {createPortal(
                  <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
                    onClick={() => setIsOpen(false)}
                  />,
                  document.body
                )}
                {createPortal(
                  <motion.div
                    key="sheet"
                    id="datepicker-panel"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[201] bg-white dark:bg-gray-950 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-800 p-5 pb-8"
                    style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
                  >
                    {/* Header with close button */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        Selecionar data
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation -mr-1"
                        aria-label="Fechar"
                      >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    <CalendarContent />
                  </motion.div>,
                  document.body
                )}
              </>
            ) : (
              // ── DESKTOP: floating panel via portal, positioned absolutely ──
              createPortal(
                <motion.div
                  key="desktop-panel"
                  id="datepicker-panel"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'fixed',
                    top: dropdownPos?.top ?? 0,
                    left: dropdownPos?.left ?? 0,
                    width: Math.max(dropdownPos?.width ?? 0, 280),
                    zIndex: 9999,
                  }}
                  className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4"
                >
                  <CalendarContent compact />
                </motion.div>,
                document.body
              )
            )
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

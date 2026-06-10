'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 280 });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? parseDateStringToLocal(value) : new Date();
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Flag to skip the first pointerdown that opens the picker
  const justOpenedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Skip the very pointerdown that triggered open
      if (justOpenedRef.current) {
        justOpenedRef.current = false;
        return;
      }
      const target = e.target as Node;
      const panel = panelRef.current;
      const trigger = triggerRef.current;
      if (
        panel && !panel.contains(target) &&
        trigger && !trigger.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // Lock body scroll (mobile only)
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen, isMobile]);

  const openPicker = () => {
    if (isOpen) { setIsOpen(false); return; }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelH = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= panelH ? rect.bottom + 6 : rect.top - panelH - 6;
      setPos({ top, left: rect.left, width: Math.max(rect.width, 280) });
    }
    justOpenedRef.current = true;
    setIsOpen(true);
  };

  const selectedDate = value ? parseDateStringToLocal(value) : null;
  const displayValue = selectedDate
    ? `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1)
        .toString().padStart(2, '0')}/${selectedDate.getFullYear()}`
    : placeholder;

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) => selectedDate ? d.toDateString() === selectedDate.toDateString() : false;

  const handleDateSelect = (day: number) => {
    onChange(formatISODate(new Date(currentMonth.year, currentMonth.month, day)));
    setIsOpen(false);
  };

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      if (dir === 'prev') return prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 };
      return prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 };
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() });
    onChange(formatISODate(today));
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDay(currentMonth.year, currentMonth.month);
  const days: (number | null)[] = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const MonthNav = () => (
    <div className="flex items-center justify-between mb-3">
      <button
        type="button"
        onClick={() => navigateMonth('prev')}
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
      </button>
      <span className="text-sm font-semibold text-gray-900 dark:text-white select-none">
        {months[currentMonth.month]} {currentMonth.year}
      </span>
      <button
        type="button"
        onClick={() => navigateMonth('next')}
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
      </button>
    </div>
  );

  const DayGrid = ({ cellMin }: { cellMin: string }) => (
    <>
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 text-center py-1 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="aspect-square" />;
          const date = new Date(currentMonth.year, currentMonth.month, day);
          const today = isToday(date);
          const sel = isSelected(date);
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateSelect(day)}
              className={`aspect-square rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center ${cellMin} ${
                sel
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold'
                  : today
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-gray-300 dark:ring-gray-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );

  const TodayBtn = () => (
    <button
      type="button"
      onClick={goToToday}
      className="w-full mt-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-colors touch-manipulation border border-gray-200 dark:border-gray-800"
    >
      Hoje
    </button>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all flex items-center gap-2.5"
      >
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" strokeWidth={1.8} />
        <span className={selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}>
          {displayValue}
        </span>
      </button>

      {mounted && isOpen && (
        isMobile ? (
          // ── MOBILE: bottom sheet ──
          createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
                onClick={() => setIsOpen(false)}
              />
              {/* Sheet */}
              <div
                ref={panelRef}
                className="fixed bottom-0 left-0 right-0 z-[201] bg-white dark:bg-gray-950 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-800 p-5"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
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
                <MonthNav />
                <DayGrid cellMin="min-h-[44px]" />
                <TodayBtn />
              </div>
            </>,
            document.body
          )
        ) : (
          // ── DESKTOP: fixed portal panel ──
          createPortal(
            <div
              ref={panelRef}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 99999,
              }}
              className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <MonthNav />
              <DayGrid cellMin="min-h-[32px]" />
              <TodayBtn />
            </div>,
            document.body
          )
        )
      )}
    </div>
  );
}

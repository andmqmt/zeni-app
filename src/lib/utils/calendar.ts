import { DailyBalance } from '@/types';
import { formatCurrency } from './format';
import { getBalanceStatusColor } from './status';

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days: Date[] = [];

  const startDay = firstDay.getDay();
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(year, month - 1, -i);
    days.unshift(prevDate);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month - 1, day));
  }

  const endDay = lastDay.getDay();
  for (let i = 1; i < 7 - endDay; i++) {
    days.push(new Date(year, month, i));
  }

  return days;
};

export const getBalanceForDate = (date: Date, balances: DailyBalance[]): DailyBalance | null => {
  const dateStr = date.toISOString().split('T')[0];
  return balances.find(b => b.date === dateStr) || null;
};

export const isSameMonth = (date: Date, currentMonth: number): boolean => {
  return date.getMonth() + 1 === currentMonth;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

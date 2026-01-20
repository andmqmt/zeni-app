import { DailyBalance, UserPreferences } from '@/types';
import { formatISODate } from './format';
import { getBalanceStatus } from './status';

interface PreviewTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
}

export function combineDailyBalancesWithPreviews(
  backendBalances: DailyBalance[],
  previewTransactions: PreviewTransaction[],
  year: number,
  month: number,
  preferences?: UserPreferences
): DailyBalance[] {
  const combinedBalances: Map<string, DailyBalance> = new Map();

  backendBalances.forEach((balance) => {
    combinedBalances.set(balance.date, { ...balance });
  });

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const startISO = formatISODate(monthStart);
  const endISO = formatISODate(monthEnd);

  const monthPreviews = previewTransactions.filter(
    (preview) => preview.transaction_date >= startISO && preview.transaction_date <= endISO
  );

  const sortedBalances = Array.from(combinedBalances.values()).sort((a, b) => a.date.localeCompare(b.date));

  const previewsByDate = new Map<string, PreviewTransaction[]>();
  monthPreviews.forEach((preview) => {
    const dateStr = preview.transaction_date;
    if (!previewsByDate.has(dateStr)) {
      previewsByDate.set(dateStr, []);
    }
    previewsByDate.get(dateStr)!.push(preview);
  });

  const allDates = new Set<string>();
  sortedBalances.forEach((b) => allDates.add(b.date));
  previewsByDate.forEach((_, date) => allDates.add(date));
  
  const sortedDates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

  const result: DailyBalance[] = [];

  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    const existing = combinedBalances.get(dateStr);
    const dayPreviews = previewsByDate.get(dateStr) || [];
    
    const previewImpact = dayPreviews.reduce((sum, p) => {
      return sum + (p.type === 'income' ? p.amount : -p.amount);
    }, 0);

    let balance: number;
    let status: DailyBalance['status'];

    if (existing) {
      balance = existing.balance + previewImpact;
      status = preferences ? getBalanceStatus(balance, preferences) : existing.status;
    } else {
      if (i === 0) {
        balance = previewImpact;
      } else {
        balance = result[i - 1].balance + previewImpact;
      }
      status = preferences ? getBalanceStatus(balance, preferences) : null;
    }

    result.push({
      date: dateStr,
      balance,
      status,
    });
  }

  for (let i = 1; i < result.length; i++) {
    const currentDate = new Date(result[i].date);
    const prevDate = new Date(result[i - 1].date);
    const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) {
      const insertions: DailyBalance[] = [];
      for (let day = 1; day < daysDiff; day++) {
        const missingDate = new Date(prevDate);
        missingDate.setDate(missingDate.getDate() + day);
        const missingDateStr = formatISODate(missingDate);
        
        insertions.push({
          date: missingDateStr,
          balance: result[i - 1].balance,
          status: result[i - 1].status,
        });
      }
      result.splice(i, 0, ...insertions);
      i += insertions.length;
    }
  }

  return result;
}

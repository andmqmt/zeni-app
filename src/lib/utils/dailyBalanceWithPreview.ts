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
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const startISO = formatISODate(monthStart);
  const endISO = formatISODate(monthEnd);

  const monthPreviews = previewTransactions.filter(
    (preview) => preview.transaction_date >= startISO && preview.transaction_date <= endISO
  );

  const backendBalancesMap = new Map<string, DailyBalance>();
  backendBalances.forEach((balance) => {
    backendBalancesMap.set(balance.date, { ...balance });
  });

  const previewsByDate = new Map<string, PreviewTransaction[]>();
  monthPreviews.forEach((preview) => {
    const dateStr = preview.transaction_date;
    if (!previewsByDate.has(dateStr)) {
      previewsByDate.set(dateStr, []);
    }
    previewsByDate.get(dateStr)!.push(preview);
  });

  const daysInMonth = monthEnd.getDate();
  const result: DailyBalance[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = formatISODate(date);
    
    const dayPreviews = previewsByDate.get(dateStr) || [];
    const dayPreviewImpact = dayPreviews.reduce((sum, p) => {
      return sum + (p.type === 'income' ? p.amount : -p.amount);
    }, 0);

    let cumulativePreviewImpact = 0;
    for (let d = 1; d <= day; d++) {
      const checkDate = new Date(year, month - 1, d);
      const checkDateStr = formatISODate(checkDate);
      const checkPreviews = previewsByDate.get(checkDateStr) || [];
      cumulativePreviewImpact += checkPreviews.reduce((sum, p) => {
        return sum + (p.type === 'income' ? p.amount : -p.amount);
      }, 0);
    }

    const existing = backendBalancesMap.get(dateStr);
    
    let balance: number;
    let status: DailyBalance['status'];

    if (existing) {
      balance = existing.balance + cumulativePreviewImpact;
      status = preferences ? getBalanceStatus(balance, preferences) : existing.status;
    } else {
      if (day === 1) {
        balance = cumulativePreviewImpact;
      } else {
        const prevBalance = result[result.length - 1].balance;
        balance = prevBalance + dayPreviewImpact;
      }
      status = preferences ? getBalanceStatus(balance, preferences) : null;
    }

    result.push({
      date: dateStr,
      balance,
      status,
    });
  }

  return result;
}

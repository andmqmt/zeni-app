import { useTransactions } from './useTransactions';
import { usePreviewTransactions } from '@/contexts/PreviewTransactionContext';
import { Transaction } from '@/types';

export function useTransactionsWithPreview(params?: Parameters<typeof useTransactions>[0]) {
  const { data: realTransactions, isLoading, error } = useTransactions(params);
  const { previewTransactions } = usePreviewTransactions();

  const allTransactions: Transaction[] = [
    ...(realTransactions || []),
    ...previewTransactions.map((preview) => ({
      id: preview.id as unknown as number,
      user_id: 0,
      description: preview.description,
      amount: preview.amount,
      type: preview.type,
      transaction_date: preview.transaction_date,
      created_at: new Date(preview.createdAt).toISOString(),
      updated_at: undefined,
    })),
  ].sort((a, b) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateA = new Date(a.transaction_date + 'T00:00:00');
    const dateB = new Date(b.transaction_date + 'T00:00:00');
    dateA.setHours(0, 0, 0, 0);
    dateB.setHours(0, 0, 0, 0);
    
    const aIsToday = dateA.getTime() === today.getTime();
    const bIsToday = dateB.getTime() === today.getTime();
    
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    
    const aIsFuture = dateA > today;
    const bIsFuture = dateB > today;
    
    if (aIsFuture && bIsFuture) {
      return dateA.getTime() - dateB.getTime();
    }
    
    if (!aIsFuture && !bIsFuture) {
      return dateB.getTime() - dateA.getTime();
    }
    
    if (aIsFuture) return -1;
    return 1;
  });

  return {
    data: allTransactions,
    isLoading,
    error,
  };
}

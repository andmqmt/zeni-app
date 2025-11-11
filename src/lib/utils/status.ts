import { BalanceStatus } from '@/types';

export const getBalanceStatusColor = (status: BalanceStatus | null): string => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const colors: Record<BalanceStatus, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    unconfigured: 'bg-gray-400',
  };
  return colors[status];
};

// Removed budget status helpers as budgets feature was deprecated.

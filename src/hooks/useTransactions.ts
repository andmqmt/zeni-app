import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService, TransactionQuery, BalanceQuery } from '@/lib/api/transaction.service';
import { Transaction, TransactionCreate, TransactionUpdate, DailyBalance } from '@/types';

export const useTransactions = (params?: TransactionQuery) => {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', params],
    queryFn: () => transactionService.getAll(params),
  });
};

export const useTransaction = (id: number) => {
  return useQuery<Transaction>({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getById(id),
    enabled: !!id,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (transaction: TransactionCreate) => transactionService.create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionUpdate }) => 
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
    },
  });
};

export const useDailyBalance = (params: BalanceQuery) => {
  return useQuery<DailyBalance[]>({
    queryKey: ['dailyBalance', params],
    queryFn: () => transactionService.getDailyBalance(params),
  });
};

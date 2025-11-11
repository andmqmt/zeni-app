import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringService } from '@/lib/api/recurring.service';
import { Recurring, RecurringCreate } from '@/types';

export const useRecurring = () => {
  return useQuery<Recurring[]>({
    queryKey: ['recurring'],
    queryFn: () => recurringService.getAll(),
  });
};

export const useCreateRecurring = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (recurring: RecurringCreate) => recurringService.create(recurring),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
};

export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => recurringService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
};

export const useMaterializeRecurring = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (upToDate: string) => recurringService.materialize(upToDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
    },
  });
};

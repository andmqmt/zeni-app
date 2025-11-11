import { api } from './client';
import { 
  Transaction, 
  TransactionCreate, 
  TransactionUpdate, 
  DailyBalance, 
  CategorySuggestion 
} from '@/types';

export interface TransactionQuery {
  skip?: number;
  limit?: number;
  on_date?: string;
  category_id?: number;
}

export interface BalanceQuery {
  year: number;
  month: number;
}

export const transactionService = {
  async getAll(params?: TransactionQuery): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>('/transactions/', { 
      params: params as unknown as Record<string, unknown> 
    });
    return data;
  },

  async getById(id: number): Promise<Transaction> {
    const { data } = await api.get<Transaction>(`/transactions/${id}`);
    return data;
  },

  async create(transaction: TransactionCreate): Promise<Transaction> {
    const { data } = await api.post<Transaction>('/transactions/', transaction);
    return data;
  },

  async update(id: number, transaction: TransactionUpdate): Promise<Transaction> {
    const { data } = await api.put<Transaction>(`/transactions/${id}`, transaction);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getDailyBalance(params: BalanceQuery): Promise<DailyBalance[]> {
    const { data } = await api.get<DailyBalance[]>('/transactions/daily-balance', { 
      params: params as unknown as Record<string, unknown> 
    });
    return data;
  },

  async suggestCategory(description: string): Promise<CategorySuggestion> {
    const { data } = await api.post<CategorySuggestion>('/transactions/suggest-category', {
      description,
    });
    return data;
  },
};

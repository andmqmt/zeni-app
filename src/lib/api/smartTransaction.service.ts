import { api } from './client';

export interface SmartTransactionRequest {
  command: string;
}

export interface SmartTransactionResponse {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
  confidence: number;
}

export const smartTransactionService = {
  parseCommand: async (command: string): Promise<SmartTransactionResponse> => {
    const response = await api.post<SmartTransactionResponse>('/transactions/smart-parse', {
      command,
    });
    return response.data;
  },
};

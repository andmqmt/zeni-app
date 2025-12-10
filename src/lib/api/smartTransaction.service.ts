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

  parseImage: async (file: File): Promise<SmartTransactionResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post<SmartTransactionResponse>(
      '/transactions/smart-parse-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  parseAudio: async (file: File): Promise<SmartTransactionResponse> => {
    const formData = new FormData();
    formData.append('audio', file);
    
    const response = await api.post<SmartTransactionResponse>(
      '/transactions/smart-parse-audio',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

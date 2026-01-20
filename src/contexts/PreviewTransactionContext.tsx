'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Transaction, TransactionCreate } from '@/types';

interface PreviewTransaction extends Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  id: string;
  createdAt: number;
  expiresAt: number;
}

interface PreviewTransactionContextType {
  previewTransactions: PreviewTransaction[];
  addPreview: (transaction: TransactionCreate) => void;
  removePreview: (id: string) => void;
  savePreview: (id: string) => Promise<void>;
  clearExpired: () => void;
}

const PreviewTransactionContext = createContext<PreviewTransactionContextType | undefined>(undefined);

export function PreviewTransactionProvider({ children }: { children: ReactNode }) {
  const [previewTransactions, setPreviewTransactions] = useState<PreviewTransaction[]>([]);

  const addPreview = useCallback((transaction: TransactionCreate) => {
    const now = Date.now();
    const previewId = `preview-${now}-${Math.random().toString(36).substr(2, 9)}`;
    
    const preview: PreviewTransaction = {
      id: previewId,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      transaction_date: transaction.transaction_date,
      createdAt: now,
      expiresAt: now + 60000,
    };

    setPreviewTransactions((prev) => [...prev, preview]);
  }, []);

  const removePreview = useCallback((id: string) => {
    setPreviewTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const savePreview = useCallback(async (id: string) => {
    const preview = previewTransactions.find((t) => t.id === id);
    if (!preview) return;

    const { transactionService } = await import('@/lib/api/transaction.service');
    
    const transactionData: TransactionCreate = {
      description: preview.description,
      amount: preview.amount,
      type: preview.type,
      transaction_date: preview.transaction_date,
    };

    await transactionService.create(transactionData);
    removePreview(id);
  }, [previewTransactions, removePreview]);

  const clearExpired = useCallback(() => {
    const now = Date.now();
    setPreviewTransactions((prev) => prev.filter((t) => t.expiresAt > now));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      clearExpired();
    }, 1000);

    return () => clearInterval(interval);
  }, [clearExpired]);

  return (
    <PreviewTransactionContext.Provider
      value={{
        previewTransactions,
        addPreview,
        removePreview,
        savePreview,
        clearExpired,
      }}
    >
      {children}
    </PreviewTransactionContext.Provider>
  );
}

export function usePreviewTransactions() {
  const context = useContext(PreviewTransactionContext);
  if (context === undefined) {
    throw new Error('usePreviewTransactions must be used within a PreviewTransactionProvider');
  }
  return context;
}

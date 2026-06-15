'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { transactionService } from '@/lib/api/transaction.service';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { usePreviewTransactions } from '@/contexts/PreviewTransactionContext';
import DatePicker from '@/components/ui/DatePicker';
import { formatISODate } from '@/lib/utils/format';

interface TransactionFormData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
}

const initialFormData = (): TransactionFormData => ({
  description: '',
  amount: 0,
  type: 'expense',
  transaction_date: formatISODate(new Date()),
});

interface FloatingTransactionButtonProps {
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

// ── Shared form content extracted as a stable component ──
interface TransactionFormContentProps {
  formData: TransactionFormData;
  isProcessing: boolean;
  onTypeChange: (type: 'income' | 'expense') => void;
  onAmountChange: (v: number) => void;
  onDescriptionChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSaveAndNew: () => void;
  onPreview: () => void;
  onClose: () => void;
}

function TransactionFormContent({
  formData,
  isProcessing,
  onTypeChange,
  onAmountChange,
  onDescriptionChange,
  onDateChange,
  onSubmit,
  onSaveAndNew,
  onPreview,
  onClose,
}: TransactionFormContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Nova transação
        </h3>
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
          <button
            type="button"
            onClick={() => onTypeChange('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              formData.type === 'expense'
                ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              formData.type === 'income'
                ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" strokeWidth={2.5} />
            Receita
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Valor
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              inputMode="decimal"
              placeholder="0,00"
              value={formData.amount || ''}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xl font-semibold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Descrição
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Supermercado"
            value={formData.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Data
          </label>
          <DatePicker
            value={formData.transaction_date}
            onChange={onDateChange}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Primary */}
          <button
            type="button"
            onClick={onSaveAndNew}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar e Criar Nova'
            )}
          </button>

          {/* Secondary row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPreview}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e Fechar'
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

// ── Main component ──

export default function FloatingTransactionButton({
  isOpenExternal,
  onCloseExternal,
}: FloatingTransactionButtonProps = {}) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isControlled = isOpenExternal !== undefined;
  const isOpen = isControlled ? isOpenExternal : isOpenInternal;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      if (!value && onCloseExternal) onCloseExternal();
    } else {
      setIsOpenInternal(value);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const { addPreview } = usePreviewTransactions();
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle visual viewport resize (mobile keyboard)
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const vh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      handleResize();
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [isOpen]);

  const resetAndClose = () => {
    if (isProcessing) return;
    setIsOpen(false);
    setFormData(initialFormData());
  };

  const validateForm = (): boolean => {
    if (!formData.description.trim() || formData.amount <= 0) {
      error('Preencha todos os campos corretamente');
      return false;
    }
    return true;
  };

  const saveTransaction = async (): Promise<boolean> => {
    if (!validateForm()) return false;
    setIsProcessing(true);
    try {
      await transactionService.create({
        description: formData.description,
        amount: formData.amount,
        type: formData.type,
        transaction_date: formData.transaction_date,
      });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
      return true;
    } catch (err: any) {
      console.error('Transaction error:', err);
      error('Erro ao criar transação. Tente novamente.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveTransaction();
    if (!saved) return;
    const typeText = formData.type === 'income' ? 'Receita' : 'Despesa';
    success(`${typeText} "${formData.description}" registrada`);
    setFormData(initialFormData());
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleSaveAndCreateNew = async () => {
    const saved = await saveTransaction();
    if (!saved) return;
    const typeText = formData.type === 'income' ? 'Receita' : 'Despesa';
    success(`${typeText} "${formData.description}" registrada — adicione outra`);
    setFormData(initialFormData());
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    addPreview({
      description: formData.description,
      amount: formData.amount,
      type: formData.type,
      transaction_date: formData.transaction_date,
    });
    success('Preview criada — expira em 1 minuto');
    setFormData(initialFormData());
    setTimeout(() => setIsOpen(false), 300);
  };

  const formProps = {
    formData,
    isProcessing,
    onTypeChange: (type: 'income' | 'expense') => setFormData({ ...formData, type }),
    onAmountChange: (v: number) => setFormData({ ...formData, amount: v }),
    onDescriptionChange: (v: string) => setFormData({ ...formData, description: v }),
    onDateChange: (v: string) => setFormData({ ...formData, transaction_date: v }),
    onSubmit: handleSubmit,
    onSaveAndNew: handleSaveAndCreateNew,
    onPreview: handlePreview,
    onClose: resetAndClose,
  };

  return (
    <>
      {/* All modal content rendered in document.body to escape any CSS transform context */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-[90]"
                onClick={resetAndClose}
              />

              {/* ── Mobile: bottom sheet ── */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className="fixed z-[91] inset-x-0 bottom-0 md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="w-full bg-white dark:bg-gray-950 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
                  style={{ maxHeight: 'calc(var(--vh, 1vh) * 88)' }}
                >
                  <TransactionFormContent {...formProps} />
                </div>
              </motion.div>

              {/* ── Desktop: centered dialog ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="hidden md:flex fixed inset-0 z-[91] items-center justify-center"
                onClick={resetAndClose}
              >
                <div
                  className="w-[400px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TransactionFormContent {...formProps} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* FAB — mobile only */}
      {!isControlled && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden fixed bottom-6 right-5 w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-md items-center justify-center z-[80] active:scale-95"
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </motion.button>
      )}
    </>
  );
}

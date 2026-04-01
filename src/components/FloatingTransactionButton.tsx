'use client';

import { useState, useEffect } from 'react';
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

export default function FloatingTransactionButton() {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

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

      const typeText = formData.type === 'income' ? 'Receita' : 'Despesa';
      success(`${typeText} "${formData.description}" registrada`);
      setFormData(initialFormData());
      setTimeout(() => setIsOpen(false), 300);
    } catch (err: any) {
      console.error('Transaction error:', err);
      error('Erro ao criar transação. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <>
      {/* Modal Overlay + Content */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
              onClick={resetAndClose}
            />

            {/* Modal — mobile: bottom sheet, desktop: centered dialog */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed z-[91] inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full md:w-[400px] md:max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-950 rounded-t-2xl md:rounded-2xl shadow-2xl border border-transparent md:border-gray-200 md:dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]"
                style={{ maxHeight: 'calc(var(--vh, 100vh) - 2rem)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header — minimal */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Nova transação
                  </h3>
                  <button
                    onClick={resetAndClose}
                    disabled={isProcessing}
                    className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
                  {/* Type Toggle — segmented control inspired by Nubank */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
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
                      onClick={() => setFormData({ ...formData, type: 'income' })}
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

                  {/* Amount — large, prominent, bank-style */}
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
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                        }
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
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
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
                      onChange={(date) =>
                        setFormData({ ...formData, transaction_date: date })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Actions — clean, two main buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
                    >
                      Preview
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-[2] py-3 rounded-xl text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB — floating action button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg flex items-center justify-center z-[80] active:scale-95 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

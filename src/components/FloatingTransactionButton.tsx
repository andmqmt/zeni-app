'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, ChevronDown } from 'lucide-react';
import { transactionService } from '@/lib/api/transaction.service';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { usePreviewTransactions } from '@/contexts/PreviewTransactionContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import { formatISODate } from '@/lib/utils/format';

interface TransactionFormData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
}

export default function FloatingTransactionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const typePickerRef = useRef<HTMLDivElement>(null);
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const { addPreview } = usePreviewTransactions();

  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: 0,
    type: 'expense',
    transaction_date: formatISODate(new Date()),
  });

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (typePickerRef.current && !typePickerRef.current.contains(event.target as Node)) {
        setIsTypePickerOpen(false);
      }
    };

    if (isTypePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTypePickerOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim() || formData.amount <= 0) {
      error('Preencha todos os campos corretamente');
      return;
    }

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
      success(`${typeText} "${formData.description}" de R$ ${formData.amount.toFixed(2)} cadastrada com sucesso!`);
      
      setFormData({
        description: '',
        amount: 0,
        type: 'expense',
        transaction_date: formatISODate(new Date()),
      });
      
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    } catch (err: any) {
      console.error('Transaction error:', err);
      error('Erro ao criar transação. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = () => {
    if (!formData.description.trim() || formData.amount <= 0) {
      error('Preencha todos os campos corretamente');
      return;
    }

    addPreview({
      description: formData.description,
      amount: formData.amount,
      type: formData.type,
      transaction_date: formData.transaction_date,
    });

    success('Transação preview criada! Ela desaparecerá em 1 minuto.');
    
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      transaction_date: formatISODate(new Date()),
    });
    
    setTimeout(() => {
      setIsOpen(false);
    }, 500);
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsOpen(false);
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      transaction_date: formatISODate(new Date()),
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
              onClick={handleClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2 w-full md:w-[420px] max-h-[90vh] md:max-h-[600px] bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 z-[91] overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(var(--vh, 100vh) - 2rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-900 dark:bg-gray-100 p-4 md:p-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-white dark:text-gray-900 text-lg">Nova Transação</h3>
                  <p className="text-xs text-white/70 dark:text-gray-900/70 mt-0.5">
                    Preencha os dados da transação
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="p-2 hover:bg-white/10 dark:hover:bg-gray-900/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-white dark:text-gray-900" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 md:p-5 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                <div ref={typePickerRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTypePickerOpen(!isTypePickerOpen)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all flex items-center justify-between touch-manipulation"
                  >
                    <span className={formData.type ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                      {formData.type === 'income' ? 'Receita' : formData.type === 'expense' ? 'Despesa' : 'Selecione o tipo'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isTypePickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isTypePickerOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] md:hidden"
                          onClick={() => setIsTypePickerOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 100 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 100 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="fixed md:absolute z-[101] md:z-50 mt-0 md:mt-2 bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-xl shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 p-4 w-full md:w-full bottom-0 md:bottom-auto left-0 md:left-auto"
                          style={{ 
                            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
                          }}
                        >
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, type: 'expense' });
                                setIsTypePickerOpen(false);
                              }}
                              className={`w-full px-4 py-3 rounded-lg text-left transition-colors touch-manipulation ${
                                formData.type === 'expense'
                                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              Despesa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, type: 'income' });
                                setIsTypePickerOpen(false);
                              }}
                              className={`w-full px-4 py-3 rounded-lg text-left transition-colors touch-manipulation ${
                                formData.type === 'income'
                                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              Receita
                            </button>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="hidden md:block absolute z-50 mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-1"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, type: 'expense' });
                              setIsTypePickerOpen(false);
                            }}
                            className={`w-full px-4 py-2 rounded-md text-left transition-colors ${
                              formData.type === 'expense'
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            Despesa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, type: 'income' });
                              setIsTypePickerOpen(false);
                            }}
                            className={`w-full px-4 py-2 rounded-md text-left transition-colors ${
                              formData.type === 'income'
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            Receita
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0,00"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Ex: Supermercado"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Preview
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-2xl flex items-center justify-center z-[80] hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

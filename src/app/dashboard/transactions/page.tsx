"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import { useTransactionsWithPreview } from "@/hooks/useTransactionsWithPreview";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate, formatDateShort, formatMonthYear, formatISODate } from "@/lib/utils/format";
import { handleApiError } from "@/lib/utils/error";
import { useToast } from "@/contexts/ToastContext";
import {
  Pencil,
  Trash2,
  Calendar,
  Filter,
} from "lucide-react";
import { Transaction, TransactionCreate } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePreviewTransactions } from "@/contexts/PreviewTransactionContext";
import Loading from "@/components/Loading";
import PageTransition from "@/components/PageTransition";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import PreviewCountdown from "@/components/PreviewCountdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import MonthPicker from "@/components/ui/MonthPicker";
import { Save, Clock } from "lucide-react";

export default function TransactionsPage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const searchParams = useSearchParams();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: number }>({});
  const [notifiedPreviews, setNotifiedPreviews] = useState<Set<string>>(new Set());
  const { t } = useLanguage();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { previewTransactions, savePreview, removePreview } = usePreviewTransactions();

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setFilterDate(dateParam);
      const [year, month] = dateParam.split('-');
      setFilterMonth(`${year}-${month}`);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState<TransactionCreate>({
    description: "",
    amount: 0,
    type: "expense",
    transaction_date: formatISODate(new Date()),
  });

  const { data: allTransactionsData, isLoading } = useTransactionsWithPreview({
    on_date: filterDate || undefined,
  });

  const transactions = allTransactionsData?.filter((t) => {
    if (!filterMonth) return true;
    const txMonth = t.transaction_date.substring(0, 7);
    return txMonth === filterMonth;
  }) || [];

  const groupTransactionsByMonth = (txs: Transaction[] | undefined) => {
    if (!txs) return [];
    
    const groups: { [key: string]: Transaction[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    txs.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(transaction);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, groupTxs]) => ({
        monthKey,
        monthLabel: formatMonthYear(groupTxs[0].transaction_date),
        transactions: groupTxs.sort((a, b) => {
          const dateA = new Date(a.transaction_date + 'T00:00:00');
          const dateB = new Date(b.transaction_date + 'T00:00:00');
          dateA.setHours(0, 0, 0, 0);
          dateB.setHours(0, 0, 0, 0);
          
          const aIsToday = dateA.getTime() === today.getTime();
          const bIsToday = dateB.getTime() === today.getTime();
          
          if (aIsToday && !bIsToday) return -1;
          if (!aIsToday && bIsToday) return 1;
          
          const aIsFuture = dateA > today;
          const bIsFuture = dateB > today;
          
          if (aIsFuture && bIsFuture) {
            return dateA.getTime() - dateB.getTime();
          }
          
          if (!aIsFuture && !bIsFuture) {
            return dateB.getTime() - dateA.getTime();
          }
          
          if (aIsFuture) return -1;
          return 1;
        }),
      }));
  };

  const groupedTransactions = groupTransactionsByMonth(transactions);
  const deleteMutation = useDeleteTransaction();
  const updateMutation = useUpdateTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!editingId) return;

    try {
      await updateMutation.mutateAsync({ id: editingId, data: formData });
      toast.success("Transação atualizada!");
      setFormData({
        description: "",
        amount: 0,
        type: "expense",
        transaction_date: formatISODate(new Date()),
      });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (isPreview(id)) {
      removePreview(id);
      toast.success("Preview removido");
      return;
    }
    if (confirm("Excluir esta transação?")) {
      try {
        await deleteMutation.mutateAsync(id as number);
        toast.success("Transação excluída!");
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining: { [key: string]: number } = {};
      const expiredIds: string[] = [];
      const newNotified = new Set(notifiedPreviews);
      
      previewTransactions.forEach((preview) => {
        const remainingMs = preview.expiresAt - now;
        if (remainingMs > 0) {
          const secondsRemaining = Math.ceil(remainingMs / 1000);
          remaining[preview.id] = secondsRemaining;
          
          if (secondsRemaining <= 5 && !notifiedPreviews.has(`${preview.id}-5s`)) {
            toast.error(`Transação "${preview.description}" expira em ${secondsRemaining}s!`);
            newNotified.add(`${preview.id}-5s`);
          } else if (secondsRemaining <= 10 && !notifiedPreviews.has(`${preview.id}-10s`)) {
            toast.error(`Transação "${preview.description}" expira em ${secondsRemaining}s!`);
            newNotified.add(`${preview.id}-10s`);
          }
        } else {
          expiredIds.push(preview.id);
        }
      });
      
      if (expiredIds.length > 0) {
        expiredIds.forEach((id) => {
          const preview = previewTransactions.find((p) => p.id === id);
          if (preview && !notifiedPreviews.has(`${id}-expired`)) {
            toast.error(`Transação preview "${preview.description}" expirou e foi removida.`);
            newNotified.add(`${id}-expired`);
          }
        });
      }
      
      setTimeRemaining(remaining);
      setNotifiedPreviews(newNotified);
    }, 100);

    return () => clearInterval(interval);
  }, [previewTransactions, notifiedPreviews, toast]);

  const handleSavePreview = async (id: string) => {
    try {
      await savePreview(id);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
      toast.success('Transação salva com sucesso!');
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving preview:', err);
      toast.error('Erro ao salvar transação. Tente novamente.');
    }
  };

  const isPreview = (id: number | string): id is string => {
    return typeof id === 'string' && id.startsWith('preview-');
  };

  const openEdit = (t: Transaction) => {
    if (isPreview(t.id)) {
      toast.error('Transações preview não podem ser editadas. Salve-a primeiro.');
      return;
    }
    setEditingId(t.id as number);
    setFormData({
      description: t.description,
      amount: t.amount,
      type: t.type,
      transaction_date: t.transaction_date,
    });
    setShowForm(true);
    setError("");
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Transações
          </h1>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "income" | "expense") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      description: "",
                      amount: 0,
                      type: "expense",
                      transaction_date: formatISODate(new Date()),
                    });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  {updateMutation.isPending ? "Salvando..." : "Atualizar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mês
            </label>
            <MonthPicker
              value={filterMonth}
              onChange={(month) => {
                setFilterMonth(month);
                setFilterDate('');
              }}
              className="w-full"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Data Específica
            </label>
            <DatePicker
              value={filterDate || ''}
              onChange={(date) => {
                setFilterDate(date);
                if (date) {
                  const [year, month] = date.split('-');
                  setFilterMonth(`${year}-${month}`);
                }
              }}
              placeholder="Selecione uma data"
              className="w-full"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loading text="Carregando..." size="lg" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {groupedTransactions.map((group) => (
                <motion.div
                  key={group.monthKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {group.monthLabel}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {group.transactions.map((transaction) => {
                      const isPreviewTransaction = isPreview(transaction.id);
                      const previewId = isPreviewTransaction && typeof transaction.id === 'string' ? transaction.id : null;
                      const remaining = isPreviewTransaction && previewId ? timeRemaining[previewId] : null;
                      
                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                            isPreviewTransaction ? 'bg-yellow-50/50 dark:bg-yellow-950/10 border-l-2 border-yellow-400 dark:border-yellow-600' : ''
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                transaction.type === "income" ? "bg-green-500" : "bg-red-500"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                    {transaction.description}
                                  </h4>
                                  {isPreviewTransaction && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="whitespace-nowrap">{formatDateShort(transaction.transaction_date)}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className={`whitespace-nowrap ${transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                    {transaction.type === "income" ? "Receita" : "Despesa"}
                                  </span>
                                  {isPreviewTransaction && remaining !== null && remaining > 0 && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
                                      <PreviewCountdown 
                                        secondsRemaining={remaining} 
                                        isExpiring={remaining <= 30}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                              <div className={`text-lg font-semibold ${
                                transaction.type === "income"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}>
                                {transaction.type === "income" ? "+" : "-"}
                                <CurrencyDisplay value={transaction.amount} />
                              </div>
                              <div className="flex items-center gap-1">
                                {isPreviewTransaction && previewId ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSavePreview(previewId)}
                                    className="flex items-center gap-1.5"
                                    title="Salvar transação"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                    Salvar
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEdit(transaction)}
                                      title="Editar"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(transaction.id)}
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Filter className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Nenhuma transação encontrada
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Crie uma nova transação para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

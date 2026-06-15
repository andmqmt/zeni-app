"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
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
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
  ChevronLeft,
  Plus,
  Copy,
  CheckSquare,
  Square,
  CalendarPlus,
  X as XIcon,
  Loader2,
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
import { Save } from "lucide-react";
import FloatingTransactionButton from "@/components/FloatingTransactionButton";
import { transactionService } from "@/lib/api/transaction.service";

export default function TransactionsPage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{
    description: string;
    amount: number;
    type: 'income' | 'expense';
    transaction_date: string;
  } | undefined>(undefined);

  // ── Multi-select state ──
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

  const handleDuplicate = (t: Transaction) => {
    if (isPreview(t.id)) {
      toast.error('Transações preview não podem ser duplicadas.');
      return;
    }
    setDuplicateData({
      description: t.description,
      amount: t.amount,
      type: t.type,
      transaction_date: formatISODate(new Date()),
    });
    setIsNewTransactionOpen(true);
  };

  // ── Bulk selection helpers ──
  const selectableIds = transactions
    .filter((tx) => !isPreview(tx.id))
    .map((tx) => tx.id as number);

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir ${selectedIds.size} transações selecionadas?`)) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all([...selectedIds].map((id) => transactionService.delete(id)));
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
      toast.success(`${selectedIds.size} transações excluídas!`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Erro ao excluir. Tente novamente.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDuplicateToNextMonth = async () => {
    if (selectedIds.size === 0) return;
    const selectedTxs = transactions.filter(
      (tx) => !isPreview(tx.id) && selectedIds.has(tx.id as number)
    );
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        selectedTxs.map((tx) => {
          const date = new Date(tx.transaction_date + 'T00:00:00');
          date.setMonth(date.getMonth() + 1);
          return transactionService.create({
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            transaction_date: formatISODate(date),
          });
        })
      );
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });
      toast.success(`${selectedIds.size} transações duplicadas para o próximo mês!`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Erro ao duplicar. Tente novamente.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <>
      <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <div className="relative flex items-center justify-between min-h-[40px]">
          {/* Left: back arrow */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors -ml-1 touch-manipulation z-10"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Center: title — absolutely centered on full width */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap pointer-events-none">
            Transações
          </h1>

          {/* Right: desktop-only button */}
          <button
            onClick={() => setIsNewTransactionOpen(true)}
            className="hidden sm:inline-flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm z-10"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nova Transação
          </button>
        </div>

        {/* FloatingTransactionButton controlled by desktop button — supports initialData for duplicate flow */}
        <FloatingTransactionButton
          isOpenExternal={isNewTransactionOpen}
          onCloseExternal={() => {
            setIsNewTransactionOpen(false);
            setDuplicateData(undefined);
          }}
          initialData={duplicateData}
        />

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Type Toggle — segmented control */}
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

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
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
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
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

        {/* Filters — clean labels */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
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
            <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
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

        {/* Transaction list */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 overflow-hidden">
          {/* Select-all header — only when there are selectable transactions */}
          {!isLoading && selectableIds.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/30">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors touch-manipulation"
              >
                {allSelected
                  ? <CheckSquare className="w-4 h-4 text-gray-900 dark:text-white" />
                  : <Square className="w-4 h-4" />}
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
              {selectedIds.size > 0 && (
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  {selectedIds.size} selecionad{selectedIds.size === 1 ? 'a' : 'as'}
                </span>
              )}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loading text="Carregando..." size="lg" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-900">
              {groupedTransactions.map((group) => (
                <motion.div
                  key={group.monthKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-900">
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {group.monthLabel}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-900">
                    {group.transactions.map((transaction) => {
                      const isPreviewTransaction = isPreview(transaction.id);
                      const previewId = isPreviewTransaction && typeof transaction.id === 'string' ? transaction.id : null;
                      const remaining = isPreviewTransaction && previewId ? timeRemaining[previewId] : null;
                      const isSelected = !isPreviewTransaction && selectedIds.has(transaction.id as number);

                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`px-4 py-3.5 transition-colors ${
                            isPreviewTransaction
                              ? 'bg-amber-50/50 dark:bg-amber-950/10 border-l-2 border-amber-400 dark:border-amber-600'
                              : isSelected
                              ? 'bg-gray-50 dark:bg-gray-900/60'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Checkbox — only for non-preview */}
                              {!isPreviewTransaction && (
                                <button
                                  type="button"
                                  onClick={() => toggleSelect(transaction.id as number)}
                                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
                                  aria-label={isSelected ? 'Desmarcar' : 'Selecionar'}
                                >
                                  {isSelected
                                    ? <CheckSquare className="w-4 h-4 text-gray-900 dark:text-white" />
                                    : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                                </button>
                              )}
                              {/* Type indicator */}
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                transaction.type === "income"
                                  ? "bg-emerald-50 dark:bg-emerald-950/30"
                                  : "bg-red-50 dark:bg-red-950/30"
                              }`}>
                                {transaction.type === "income"
                                  ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
                                  : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" strokeWidth={2.5} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {transaction.description}
                                  </h4>
                                  {isPreviewTransaction && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
                                  <span>{formatDateShort(transaction.transaction_date)}</span>
                                  {isPreviewTransaction && remaining !== null && remaining > 0 && (
                                    <>
                                      <span>•</span>
                                      <PreviewCountdown
                                        secondsRemaining={remaining}
                                        isExpiring={remaining <= 30}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-2 pl-11 sm:pl-0">
                              <div className={`text-sm font-semibold tabular-nums ${
                                transaction.type === "income"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}>
                                {transaction.type === "income" ? "+" : "-"}
                                <CurrencyDisplay value={transaction.amount} />
                              </div>
                              <div className="flex items-center">
                                {isPreviewTransaction && previewId ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSavePreview(previewId)}
                                    className="flex items-center gap-1 h-7 text-xs"
                                    title="Salvar"
                                  >
                                    <Save className="h-3 w-3" />
                                    Salvar
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEdit(transaction)}
                                      title="Editar"
                                      className="h-8 w-8"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDuplicate(transaction)}
                                      title="Duplicar"
                                      className="h-8 w-8"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(transaction.id)}
                                      title="Excluir"
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-3">
                <Inbox className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Nenhuma transação encontrada
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Crie uma nova transação para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>

      {/* Floating bulk action bar — portal to escape transform context */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedIds.size > 0 && (
        <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-6 left-0 right-0 z-[85] flex justify-center px-4 pointer-events-none"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-900 dark:bg-white rounded-2xl shadow-2xl shadow-black/30 pointer-events-auto">
              {/* Count badge */}
              <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-white/10 dark:bg-gray-900/10 text-white dark:text-gray-900 text-xs font-bold">
                {selectedIds.size}
              </span>
              <div className="flex items-center gap-1.5">
                {/* Duplicate to next month */}
                <button
                  type="button"
                  onClick={handleDuplicateToNextMonth}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 dark:bg-gray-900/10 text-white dark:text-gray-900 hover:bg-white/20 dark:hover:bg-gray-900/20 transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {isBulkProcessing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CalendarPlus className="w-3.5 h-3.5" />}
                  <span>Próximo mês</span>
                </button>
                {/* Delete selected */}
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/80 hover:bg-red-500 text-white transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {isBulkProcessing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Excluir</span>
                </button>
              </div>
              {/* Dismiss */}
              <button
                type="button"
                onClick={clearSelection}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-xl hover:bg-white/10 dark:hover:bg-gray-900/10 text-white/70 dark:text-gray-900/70 hover:text-white dark:hover:text-gray-900 transition-colors touch-manipulation"
                aria-label="Cancelar seleção"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

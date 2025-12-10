"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import { formatCurrency, formatDate, formatDateShort, formatMonthYear, formatISODate } from "@/lib/utils/format";
import { handleApiError } from "@/lib/utils/error";
import { useToast } from "@/contexts/ToastContext";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
} from "lucide-react";
import { Transaction, TransactionCreate } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import Loading from "@/components/Loading";
import PageTransition from "@/components/PageTransition";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

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
  const { t } = useLanguage();
  const toast = useToast();

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

  const { data: allTransactions, isLoading } = useTransactions({
    on_date: filterDate || undefined,
  });

  const transactions = allTransactions?.filter((t) => {
    if (!filterMonth) return true;
    const txMonth = t.transaction_date.substring(0, 7);
    return txMonth === filterMonth;
  });

  const groupTransactionsByMonth = (txs: Transaction[] | undefined) => {
    if (!txs) return [];
    
    const groups: { [key: string]: Transaction[] } = {};
    
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
        transactions: groupTxs,
      }));
  };

  const groupedTransactions = groupTransactionsByMonth(transactions);
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();
  const updateMutation = useUpdateTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast.success("Transação atualizada!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Transação criada!");
      }
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

  const handleDelete = async (id: number) => {
    if (confirm("Excluir esta transação?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Transação excluída!");
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
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
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Transação" : "Nova Transação"}</DialogTitle>
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
                    <Input
                      type="date"
                      required
                      value={formData.transaction_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transaction_date: e.target.value,
                        })
                      }
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : editingId
                      ? "Atualizar"
                      : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="relative flex-1 min-w-[160px]">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Data exata"
              className="pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
                    {group.transactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                              transaction.type === "income" ? "bg-green-500" : "bg-red-500"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {transaction.description}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <span>{formatDateShort(transaction.transaction_date)}</span>
                                <span>•</span>
                                <span className={transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                  {transaction.type === "income" ? "Receita" : "Despesa"}
                                </span>
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
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
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

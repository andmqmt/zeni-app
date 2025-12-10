"use client";

import { useState } from "react";
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
  Search,
  TrendingUp,
  TrendingDown,
  X,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Transaction, TransactionCreate } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import Loading from "@/components/Loading";
import PageTransition from "@/components/PageTransition";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function TransactionsPage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const toast = useToast();

  const [formData, setFormData] = useState<TransactionCreate>({
    description: "",
    amount: 0,
    type: "expense",
    transaction_date: formatISODate(new Date()),
  });

  const getMonthStartEnd = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start: formatISODate(start), end: formatISODate(end) };
  };

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
        toast.success("Transação atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Transação criada com sucesso!");
      }
      // reset state
      setFormData({
        description: "",
        amount: 0,
        type: "expense",
        transaction_date: formatISODate(new Date()),
        category_id: undefined,
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
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Transação excluída com sucesso!");
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const openEdit = (t: {
    id: number;
    description: string;
    amount: number;
    type: "income" | "expense";
    transaction_date: string;
    category_id?: number;
  }) => {
    setEditingId(t.id);
    setFormData({
      description: t.description,
      amount: t.amount,
      type: t.type,
      transaction_date: t.transaction_date,
      category_id: t.category_id,
    });
    setShowForm(true);
    setError("");
  };

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Transações
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>

        {error && (
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded-lg p-3 text-sm text-danger-700 dark:text-danger-300">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Editar" : "Nova Transação"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado, Salário..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="block w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Valor (R$)
                  </label>
                  <input
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
                    className="block w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction_date: e.target.value,
                      })
                    }
                    className="block w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "income" | "expense",
                      })
                    }
                    className="block w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>


              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      description: "",
                      amount: 0,
                      type: "expense",
                      transaction_date: formatISODate(new Date()),
                      category_id: undefined,
                    });
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar"
                    : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="relative flex-1 min-w-[160px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Data exata"
              className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              Histórico de Transações
            </h3>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
              <Loading text="Carregando transações..." size="lg" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                {groupedTransactions.map((group) => (
                  <div key={group.monthKey} className="mb-8 last:mb-0">
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-800/95 backdrop-blur-sm z-10 px-6 py-3 border-b-2 border-primary-200 dark:border-primary-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {group.monthLabel}
                      </h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Data
                          </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Valor
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {group.transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatDateShort(transaction.transaction_date)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(transaction.transaction_date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                              </div>
                            </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-soft ${
                              transaction.type === "income"
                                ? "bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-700"
                                : "bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 border border-danger-200 dark:border-danger-700"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                Receita
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3" />
                                Despesa
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-base font-bold ${
                              transaction.type === "income"
                                ? "text-success-600 dark:text-success-400"
                                : "text-danger-600 dark:text-danger-400"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}{" "}
                            <CurrencyDisplay value={transaction.amount} />
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-1">
                          <button
                            onClick={() => openEdit(transaction)}
                            className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {groupedTransactions.map((group) => (
                  <div key={group.monthKey} className="mb-6 last:mb-0">
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-800/95 backdrop-blur-sm z-10 px-4 py-3 border-b-2 border-primary-200 dark:border-primary-700 mb-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {group.monthLabel}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {group.transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                {transaction.description}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span className="font-medium">
                                  {formatDateShort(transaction.transaction_date)}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">
                                  {new Date(transaction.transaction_date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                                </span>
                              </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(transaction)}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-soft ${
                          transaction.type === "income"
                            ? "bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-700"
                            : "bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 border border-danger-200 dark:border-danger-700"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            Receita
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            Despesa
                          </>
                        )}
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          transaction.type === "income"
                            ? "text-success-600 dark:text-success-400"
                            : "text-danger-600 dark:text-danger-400"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}{" "}
                        <CurrencyDisplay value={transaction.amount} />
                      </span>
                    </div>
                  </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium text-center">
                Nenhuma transação encontrada
              </p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1 text-center">
                Crie uma nova transação para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

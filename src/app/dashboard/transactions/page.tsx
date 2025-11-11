"use client";

import { useState } from "react";
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatDate, formatISODate } from "@/lib/utils/format";
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
  Tag,
  Sparkles,
} from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { TransactionCreate } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import Loading from "@/components/Loading";
import PageTransition from "@/components/PageTransition";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | undefined>();
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const toast = useToast();

  const [formData, setFormData] = useState<TransactionCreate>({
    description: "",
    amount: 0,
    type: "expense",
    transaction_date: formatISODate(new Date()),
  });

  const { data: transactions, isLoading } = useTransactions({
    on_date: filterDate || undefined,
    category_id: filterCategory,
  });

  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  // Resolve category name even if backend didn't embed the category object (e.g. auto-categorização retorna apenas category_id)
  const resolveCategoryName = (transaction: {
    category?: { name?: string };
    category_id?: number;
  }) => {
    if (transaction.category?.name) return transaction.category.name;
    if (transaction.category_id && categories) {
      const cat = categories.find(c => c.id === transaction.category_id);
      if (cat) return cat.name;
    }
    return '-';
  };
  const isAutoCategorized = (transaction: { category?: unknown; category_id?: number }) =>
    !transaction.category && !!transaction.category_id;
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white">
              {t("nav.transactions")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gerencie suas receitas e despesas
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong transition-all font-semibold text-sm md:text-base"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Nova Transação</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-800/20 border border-danger-200 dark:border-danger-700 rounded-xl md:rounded-2xl p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-danger-500 flex items-center justify-center">
                <X className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm text-danger-800 dark:text-danger-200 font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-display font-bold text-white">
                  {editingId ? "Editar Transação" : "Nova Transação"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 md:p-6 space-y-4 md:space-y-5"
            >
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                    className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
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
                    className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                    className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                  >
                    <option value="expense">💸 Despesa</option>
                    <option value="income">💰 Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categoria
                  </label>
                  <select
                    value={formData.category_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category_id: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                  >
                    <option value="">Sem categoria</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
                  className="flex-1 px-4 md:px-5 py-2.5 md:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl md:rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all text-sm md:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all text-sm md:text-base"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar Transação"
                    : "Salvar Transação"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              Filtros
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Filtrar por Data
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Filtrar por Categoria
              </label>
              <select
                value={filterCategory || ""}
                onChange={(e) =>
                  setFilterCategory(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
              >
                <option value="">Todas as categorias</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
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
                        Categoria
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
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {isLoadingCategories ? (
                            <span className="inline-block h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              {resolveCategoryName(transaction)}
                              {isAutoCategorized(transaction) && (
                                <Tooltip content="Categoria sugerida automaticamente (IA)">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-100/70 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                                    <Sparkles className="h-3 w-3" />
                                    AI
                                  </span>
                                </Tooltip>
                              )}
                            </span>
                          )}
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

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
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
                          <span>
                            {formatDate(transaction.transaction_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <Tag className="h-3 w-3" />
                          {isLoadingCategories ? (
                            <span className="inline-block h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              {resolveCategoryName(transaction)}
                              {isAutoCategorized(transaction) && (
                                <Tooltip content="Categoria sugerida automaticamente (IA)">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-100/70 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                                    <Sparkles className="h-3 w-3" />
                                    AI
                                  </span>
                                </Tooltip>
                              )}
                            </span>
                          )}
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

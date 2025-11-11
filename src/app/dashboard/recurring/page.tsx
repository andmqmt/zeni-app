'use client';

import { useState } from 'react';
import { useRecurring, useCreateRecurring, useDeleteRecurring, useMaterializeRecurring } from '@/hooks/useRecurring';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate, formatISODate } from '@/lib/utils/format';
import { handleApiError } from '@/lib/utils/error';
import { Plus, Trash2, Play, Repeat, Calendar, Tag, X, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { RecurringCreate, RecurringFrequency } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';

export default function RecurringPage() {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useLanguage();

  const [formData, setFormData] = useState<RecurringCreate>({
    description: '',
    amount: 0,
    type: 'expense',
    frequency: 'monthly',
    interval: 1,
    start_date: formatISODate(new Date()),
  });

  const { data: recurring, isLoading } = useRecurring();
  const { data: categories } = useCategories();
  const createMutation = useCreateRecurring();
  const deleteMutation = useDeleteRecurring();
  const materializeMutation = useMaterializeRecurring();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createMutation.mutateAsync(formData);
      setFormData({
        description: '',
        amount: 0,
        type: 'expense',
        frequency: 'monthly',
        interval: 1,
        start_date: formatISODate(new Date()),
      });
      setShowForm(false);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta recorrência?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  const handleMaterialize = async () => {
    const today = formatISODate(new Date());
    try {
      const result = await materializeMutation.mutateAsync(today);
      setSuccessMessage(`${result.created} transações foram criadas!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white">
            {t('nav.recurring')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automatize suas transações recorrentes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleMaterialize}
            disabled={materializeMutation.isPending}
            className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong transition-all font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 md:h-5 md:w-5" />
            {materializeMutation.isPending ? 'Processando...' : 'Materializar'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong transition-all font-semibold text-sm md:text-base"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Nova Recorrência</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-800/20 border border-danger-200 dark:border-danger-700 rounded-xl md:rounded-2xl p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-danger-500 flex items-center justify-center">
              <X className="h-3 w-3 text-white" />
            </div>
            <p className="text-sm text-danger-800 dark:text-danger-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border border-success-200 dark:border-success-700 rounded-xl md:rounded-2xl p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
            <p className="text-sm text-success-800 dark:text-success-200 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 md:px-6 py-4 md:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Repeat className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-display font-bold text-white">Nova Recorrência</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Aluguel, Netflix, Salário..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                >
                  <option value="expense">💸 Despesa</option>
                  <option value="income">💰 Receita</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Frequência
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringFrequency })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                >
                  <option value="daily">📅 Diária</option>
                  <option value="weekly">🗓️ Semanal</option>
                  <option value="monthly">📆 Mensal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Intervalo
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="1"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Início
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Data Fim (opcional)
                </label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value || undefined })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                />
              </div>
            </div>

            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Dia da Semana
                </label>
                <select
                  value={formData.weekday || 0}
                  onChange={(e) => setFormData({ ...formData, weekday: parseInt(e.target.value) })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                >
                  <option value={0}>Segunda</option>
                  <option value={1}>Terça</option>
                  <option value={2}>Quarta</option>
                  <option value={3}>Quinta</option>
                  <option value={4}>Sexta</option>
                  <option value={5}>Sábado</option>
                  <option value={6}>Domingo</option>
                </select>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Dia do Mês
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day_of_month || 1}
                  onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) })}
                  className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
                />
              </div>
            )}

            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categoria
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm md:text-base"
              >
                <option value="">Sem categoria</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 md:px-5 py-2.5 md:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl md:rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all text-sm md:text-base"
              >
                {createMutation.isPending ? 'Salvando...' : 'Criar Recorrência'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Recorrências Ativas
          </h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12 md:py-16 px-4">
            <Loading text="Carregando recorrências..." size="lg" />
          </div>
        ) : recurring && recurring.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Frequência</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Próxima</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recurring.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.type === 'income'
                              ? 'bg-success-100 dark:bg-success-900/30'
                              : 'bg-danger-100 dark:bg-danger-900/30'
                          }`}>
                            {item.type === 'income' ? (
                              <TrendingUp className="h-5 w-5 text-success-600 dark:text-success-400" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{item.description}</div>
                            {item.category && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{item.category.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-base font-bold ${
                          item.type === 'income'
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400'
                        }`}>
                          {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-700">
                          <Repeat className="h-3 w-3" />
                          {item.frequency === 'daily' && 'Diária'}
                          {item.frequency === 'weekly' && 'Semanal'}
                          {item.frequency === 'monthly' && 'Mensal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {item.next_run_date ? formatDate(item.next_run_date) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all"
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
              {recurring.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === 'income'
                          ? 'bg-success-100 dark:bg-success-900/30'
                          : 'bg-danger-100 dark:bg-danger-900/30'
                      }`}>
                        {item.type === 'income' ? (
                          <TrendingUp className="h-5 w-5 text-success-600 dark:text-success-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {item.description}
                        </h4>
                        {item.category && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.category.name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${
                        item.type === 'income'
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-danger-600 dark:text-danger-400'
                      }`}>
                        {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-700">
                        <Repeat className="h-3 w-3" />
                        {item.frequency === 'daily' && 'Diária'}
                        {item.frequency === 'weekly' && 'Semanal'}
                        {item.frequency === 'monthly' && 'Mensal'}
                      </span>
                    </div>
                    
                    {item.next_run_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>Próxima execução: {formatDate(item.next_run_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-4 shadow-soft">
              <Repeat className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium text-center">
              Nenhuma recorrência cadastrada
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1 text-center">
              Crie uma recorrência para automatizar suas transações
            </p>
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
}

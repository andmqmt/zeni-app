'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { handleApiError } from '@/lib/utils/error';
import { Plus, Trash2, Tag, X, FolderOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createMutation.mutateAsync({ name });
      setName('');
      setShowForm(false);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white">
              {t('nav.categories')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Organize suas transações por categorias
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl shadow-medium hover:shadow-strong transition-all font-semibold text-sm md:text-base"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Nova Categoria</span>
            <span className="sm:hidden">Nova</span>
          </button>
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

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 md:px-6 py-4 md:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-display font-bold text-white">Nova Categoria</h2>
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
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Nome da Categoria
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Alimentação, Transporte, Saúde..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm md:text-base"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Escolha um nome descritivo para organizar suas transações
              </p>
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
                {createMutation.isPending ? 'Salvando...' : 'Criar Categoria'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                  Minhas Categorias
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {categories?.length || 0} {categories?.length === 1 ? 'categoria' : 'categorias'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <Loading text="Carregando categorias..." size="lg" />
          </div>
        ) : categories && categories.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => (
              <li 
                key={category.id} 
                className="px-4 md:px-6 py-4 md:py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg md:rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all">
                    <Tag className="h-5 w-5 md:h-6 md:w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <span className="text-sm md:text-base text-gray-900 dark:text-white font-semibold block">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {category.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 md:p-2.5 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg md:rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Excluir categoria"
                >
                  <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-4 shadow-soft">
              <FolderOpen className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium text-center">
              Nenhuma categoria cadastrada
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1 text-center">
              Crie sua primeira categoria para começar
            </p>
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
}

'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { TrendingDown, TrendingUp, Sparkles, Lightbulb, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';

interface Insight {
  type: 'warning' | 'tip' | 'success';
  category: string;
  message: string;
  amount?: number;
  percentage?: number;
}

export default function MoneyTimePage() {
  const { data: transactions, isLoading } = useTransactions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeTransactions = (): Insight[] => {
    if (!transactions || transactions.length === 0) return [];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const txDate = new Date(t.transaction_date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const expenses = monthlyTransactions.filter((t) => t.type === 'expense');
    const income = monthlyTransactions.filter((t) => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);

    const insights: Insight[] = [];

    const categorySpending: { [key: string]: number } = {};
    expenses.forEach((t) => {
      const desc = t.description.toLowerCase();
      let category = 'Outros';
      
      if (desc.includes('uber') || desc.includes('taxi') || desc.includes('transporte') || desc.includes('gasolina') || desc.includes('combustivel')) {
        category = 'Transporte';
      } else if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('alimentação') || desc.includes('restaurante') || desc.includes('delivery') || desc.includes('ifood')) {
        category = 'Alimentação';
      } else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('disney') || desc.includes('prime') || desc.includes('assinatura')) {
        category = 'Assinaturas';
      } else if (desc.includes('energia') || desc.includes('agua') || desc.includes('luz') || desc.includes('internet') || desc.includes('aluguel')) {
        category = 'Contas Fixas';
      } else if (desc.includes('farmacia') || desc.includes('remedio') || desc.includes('medico') || desc.includes('saude')) {
        category = 'Saúde';
      }

      categorySpending[category] = (categorySpending[category] || 0) + Number(t.amount);
    });

    const sortedCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    sortedCategories.forEach(([category, amount], index) => {
      const percentage = (amount / totalExpenses) * 100;
      
      if (percentage > 40) {
        insights.push({
          type: 'warning',
          category,
          message: `Você está gastando muito com ${category}. Representa ${percentage.toFixed(0)}% dos seus gastos totais. Considere revisar esses gastos.`,
          amount,
          percentage,
        });
      } else if (percentage > 25) {
        insights.push({
          type: 'tip',
          category,
          message: `${category} é uma das suas maiores despesas (${percentage.toFixed(0)}%). Há oportunidades de economia aqui.`,
          amount,
          percentage,
        });
      } else if (index === 0) {
        insights.push({
          type: 'success',
          category,
          message: `Seus gastos com ${category} estão bem distribuídos (${percentage.toFixed(0)}%). Continue assim!`,
          amount,
          percentage,
        });
      }
    });

    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    if (savingsRate < 10 && totalIncome > 0) {
      insights.push({
        type: 'warning',
        category: 'Economia',
        message: `Você está economizando apenas ${savingsRate.toFixed(0)}% da sua renda. Tente aumentar para pelo menos 20%.`,
        amount: balance,
        percentage: savingsRate,
      });
    } else if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        category: 'Economia',
        message: `Parabéns! Você está economizando ${savingsRate.toFixed(0)}% da sua renda. Continue assim!`,
        amount: balance,
        percentage: savingsRate,
      });
    }

    if (expenses.length > 0) {
      const avgExpense = totalExpenses / expenses.length;
      const highExpenses = expenses.filter((t) => Number(t.amount) > avgExpense * 2);
      
      if (highExpenses.length > 0) {
        insights.push({
          type: 'tip',
          category: 'Gastos Altos',
          message: `Você teve ${highExpenses.length} transação(ões) com valores acima da média. Revise se eram realmente necessárias.`,
        });
      }
    }

    return insights;
  };

  const insights = analyzeTransactions();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-danger-500" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-warning-500" />;
      case 'success':
        return <TrendingUp className="h-5 w-5 text-success-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-primary-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20';
      case 'tip':
        return 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20';
      case 'success':
        return 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
    }
  };

  const handleRefresh = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-16">
          <Loading text="Carregando..." size="lg" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              MoneyTime
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Insights inteligentes sobre seus gastos
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Análise Inteligente</h2>
              <p className="text-sm text-white/90">
                Nossa IA analisou suas transações e identificou {insights.length} insight{insights.length !== 1 ? 's' : ''} importante{insights.length !== 1 ? 's' : ''} para você.
              </p>
            </div>
          </div>
        </div>

        {insights.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Sparkles className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Ainda não há insights disponíveis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adicione mais transações para que possamos analisar seus gastos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {insight.category}
                      </h3>
                      {insight.amount && (
                        <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(insight.amount)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Dicas para melhorar suas finanças
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ChevronRight className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tente manter suas despesas em no máximo 80% da sua renda
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ChevronRight className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reserve pelo menos 20% da renda para emergências e investimentos
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ChevronRight className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revise seus gastos mensalmente para identificar oportunidades de economia
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}


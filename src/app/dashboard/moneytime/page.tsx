'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Sparkles, Lightbulb, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { insightsService, type InsightsAnalysis, type Insight } from '@/lib/api/insights.service';
import Loading from '@/components/Loading';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/Button';

export default function MoneyTimePage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [analysis, setAnalysis] = useState<InsightsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await insightsService.getAnalysis(selectedYear, selectedMonth);
      setAnalysis(data);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [selectedYear, selectedMonth]);

  const insights = analysis?.insights || [];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'success':
        return <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const handleRefresh = async () => {
    setIsAnalyzing(true);
    await loadAnalysis();
    setIsAnalyzing(false);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">
              MoneyTime
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Insights inteligentes sobre seus gastos
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 dark:bg-gray-100 rounded-lg p-6 text-white dark:text-gray-900"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 dark:bg-gray-900/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Análise Inteligente</h2>
              <p className="text-sm opacity-90">
                Identificamos {insights.length} insight{insights.length !== 1 ? 's' : ''} importante{insights.length !== 1 ? 's' : ''} baseados em suas transações.
              </p>
            </div>
          </div>
        </motion.div>

        {insights.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center"
          >
            <Sparkles className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Ainda não há insights disponíveis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Adicione mais transações para análise
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {insight.title}
                      </h3>
                      {insight.amount && (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(insight.amount)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Dicas para melhorar suas finanças
          </h3>
          <div className="space-y-3">
            {[
              'Tente manter suas despesas em no máximo 80% da sua renda',
              'Reserve pelo menos 20% da renda para emergências e investimentos',
              'Revise seus gastos mensalmente para identificar oportunidades de economia'
            ].map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-1 h-1 rounded-full bg-gray-900 dark:bg-gray-100 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tip}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}


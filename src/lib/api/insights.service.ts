import { api } from './client';

export interface Insight {
  type: 'warning' | 'tip' | 'success';
  title: string;
  message: string;
  amount?: number;
  percentage?: number;
}

export interface SpendingPattern {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface InsightsSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  savings_rate: number;
  transaction_count: number;
  expense_count: number;
  income_count: number;
  avg_expense: number;
  patterns: SpendingPattern[];
}

export interface InsightsAnalysis {
  insights: Insight[];
  summary: InsightsSummary;
}

export const insightsService = {
  async getAnalysis(year: number, month: number): Promise<InsightsAnalysis> {
    const { data } = await api.get<InsightsAnalysis>('/insights/analysis', {
      params: { year, month }
    });
    return data;
  }
};


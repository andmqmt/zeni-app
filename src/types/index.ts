export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  access_code: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserPreferences {
  bad_threshold: number;
  ok_threshold: number;
  good_threshold: number;
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  auto_categorize_enabled: boolean;
  preferences?: UserPreferences;
  preferences_configured: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
}

export type TransactionType = 'income' | 'expense';

export interface TransactionCreate {
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  category_id?: number;
}

export interface TransactionUpdate {
  description?: string;
  amount?: number;
  type?: TransactionType;
  transaction_date?: string;
  category_id?: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  category_id?: number;
  category?: Category;
  created_at: string;
  updated_at?: string;
}

export type BalanceStatus = 'red' | 'yellow' | 'green' | 'unconfigured';

export interface DailyBalance {
  date: string;
  balance: number;
  status: BalanceStatus | null;
}


export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringCreate {
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  interval: number;
  start_date: string;
  end_date?: string;
  weekday?: number;
  day_of_month?: number;
  category_id?: number;
}

export interface Recurring {
  id: number;
  user_id: number;
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  interval: number;
  start_date: string;
  end_date?: string;
  weekday?: number;
  day_of_month?: number;
  category_id?: number;
  category?: Category;
  next_run_date?: string;
  created_at: string;
}

export interface CategorySuggestion {
  category?: Category;
  matched_keyword?: string;
}

export interface MaterializeResponse {
  created: number;
}

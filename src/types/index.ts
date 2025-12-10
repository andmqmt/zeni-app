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
  preferences?: UserPreferences;
  preferences_configured: boolean;
  created_at: string;
  updated_at?: string;
}

export type TransactionType = 'income' | 'expense';

export interface TransactionCreate {
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
}

export interface TransactionUpdate {
  description?: string;
  amount?: number;
  type?: TransactionType;
  transaction_date?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  created_at: string;
  updated_at?: string;
}

export type BalanceStatus = 'red' | 'yellow' | 'green' | 'unconfigured';

export interface DailyBalance {
  date: string;
  balance: number;
  status: BalanceStatus | null;
}

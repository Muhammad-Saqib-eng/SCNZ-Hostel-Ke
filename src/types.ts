export type Category = 'Food' | 'Transport' | 'Social' | 'Utilities' | 'Academic' | 'Misc';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  date: string;
}

export interface Debt {
  id: string;
  userId: string;
  peerName: string;
  amount: number;
  description: string;
  type: 'i_owe' | 'owes_me';
  settled: boolean;
}

export interface AnalysisResult {
  expenses: Expense[];
  debts?: Debt[];
  summary: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    categories: {
      category: Category;
      amount: number;
      percentage: number;
    }[];
  };
  advice: {
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'error';
  }[];
}

export interface UserProfile {
  allowance: number;
  lastReset?: string;
  currency?: string;
}

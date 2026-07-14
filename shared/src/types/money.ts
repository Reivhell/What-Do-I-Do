// @whatdo/shared — Money types

export type AccountType = 'cash' | 'bank' | 'e_wallet';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type BillStatus = 'paid' | 'unpaid';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currentBalance: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currentBalance?: number;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  currentBalance?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
  transferToAccountId: string | null;
  linkedRecurringBillId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  transferToAccountId?: string;
  linkedRecurringBillId?: string;
}

export interface UpdateTransactionInput {
  accountId?: string;
  type?: TransactionType;
  amount?: number;
  category?: string;
  date?: string;
  notes?: string;
  transferToAccountId?: string;
}

export interface RecurringBill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  status: BillStatus;
  reminderEnabled: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringBillInput {
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  status?: BillStatus;
  reminderEnabled?: boolean;
}

export interface UpdateRecurringBillInput {
  name?: string;
  amount?: number;
  dueDay?: number;
  category?: string;
  status?: BillStatus;
  reminderEnabled?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  period: BudgetPeriod;
  amountLimit: number;
  periodStart: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetInput {
  category: string;
  period: BudgetPeriod;
  amountLimit: number;
  periodStart: string;
}

export interface UpdateBudgetInput {
  category?: string;
  period?: BudgetPeriod;
  amountLimit?: number;
  periodStart?: string;
}

export interface MoneySummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  accounts: Account[];
  recentTransactions: Transaction[];
}

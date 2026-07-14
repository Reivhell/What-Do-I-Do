import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Account, CreateAccountInput, UpdateAccountInput,
  Transaction, CreateTransactionInput, UpdateTransactionInput,
  RecurringBill, CreateRecurringBillInput, UpdateRecurringBillInput,
  Budget, CreateBudgetInput, UpdateBudgetInput,
  MoneySummary,
} from '@whatdo/shared';

const BASE = '/api/money';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Summary ──

export function useMoneySummary() {
  return useQuery<MoneySummary>({
    queryKey: ['money', 'summary'],
    queryFn: () => request(`${BASE}/summary`),
  });
}

// ── Accounts ──

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ['money', 'accounts'],
    queryFn: () => request(`${BASE}/accounts`),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountInput) =>
      request<Account>(`${BASE}/accounts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountInput }) =>
      request<Account>(`${BASE}/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money'] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${BASE}/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money'] }),
  });
}

// ── Transactions ──

export function useTransactions(accountId?: string) {
  const params = accountId ? `?accountId=${accountId}` : '';
  return useQuery<Transaction[]>({
    queryKey: ['money', 'transactions', accountId],
    queryFn: () => request(`${BASE}/transactions${params}`),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      request<Transaction>(`${BASE}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money'] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      request<Transaction>(`${BASE}/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${BASE}/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money'] }),
  });
}

// ── Recurring Bills ──

export function useRecurringBills() {
  return useQuery<RecurringBill[]>({
    queryKey: ['money', 'bills'],
    queryFn: () => request(`${BASE}/bills`),
  });
}

export function useCreateRecurringBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringBillInput) =>
      request<RecurringBill>(`${BASE}/bills`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', 'bills'] }),
  });
}

export function useUpdateRecurringBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringBillInput }) =>
      request<RecurringBill>(`${BASE}/bills/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', 'bills'] }),
  });
}

export function useDeleteRecurringBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${BASE}/bills/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', 'bills'] }),
  });
}

// ── Budgets ──

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ['money', 'budgets'],
    queryFn: () => request(`${BASE}/budgets`),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetInput) =>
      request<Budget>(`${BASE}/budgets`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', 'budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetInput }) =>
      request<Budget>(`${BASE}/budgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', 'budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${BASE}/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', 'budgets'] }),
  });
}

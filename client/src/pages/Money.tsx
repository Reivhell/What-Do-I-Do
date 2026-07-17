import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMoneySummary, useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount,
  useTransactions, useCreateTransaction, useDeleteTransaction,
  useBudgets, useCreateBudget, useDeleteBudget,
} from '../api/money';
import { usePreferences } from '../api/settings';
import { useAuth } from '../providers/AuthProvider';
import { ClayInput } from '../components/ui/ClayInput';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { CreateAccountInput, CreateTransactionInput, CreateBudgetInput } from '@whatdo/shared';

export function MoneyPage() {
  const { locked } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'transactions' | 'budgets'>('overview');
  const { data: preferences } = usePreferences();

  const { data: summary, isLoading: summaryLoading } = useMoneySummary();
  const { data: accounts = [], isLoading: acctsLoading } = useAccounts();
  const { data: transactions = [], isLoading: txnsLoading } = useTransactions();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();

  const createAccount = useCreateAccount();
  const createTransaction = useCreateTransaction();
  const createBudget = useCreateBudget();

  if (locked) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full clay-inset mb-4">
            <svg className="size-8 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-ink-900 mb-2">Money is Locked</h2>
          <p className="text-ink-500">Unlock the app to view your financial data</p>
        </div>
      </div>
    );
  }
  const deleteAccount = useDeleteAccount();
  const deleteTransaction = useDeleteTransaction();
  const deleteBudget = useDeleteBudget();

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: 'dashboard' },
    { key: 'accounts' as const, label: 'Accounts', icon: 'account_balance' },
    { key: 'transactions' as const, label: 'Transactions', icon: 'receipt_long' },
    { key: 'budgets' as const, label: 'Budgets', icon: 'savings' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[28px] leading-[36px] font-bold tracking-tight text-[var(--ink-900)] flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--blue-500)] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            Money
          </h1>
          <p className="font-body text-[14px] leading-[20px] font-normal text-[var(--ink-500)] mt-1">
            Manage accounts, track transactions, and set budgets.
          </p>
        </div>
      </div>

      {/* Summary Cards Row */}
      {summary && !summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card level={1} className="p-6">
            <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Total Balance</p>
            <h3 className="font-display text-[26px] leading-[32px] font-bold text-[var(--ink-900)]">
              {preferences?.currency || 'Rp'} {summary.totalBalance.toLocaleString()}
            </h3>
          </Card>
          <Card level={1} className="p-6">
            <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Income</p>
            <h3 className="font-display text-[26px] leading-[32px] font-bold text-[var(--semantic-green)]">
              +{preferences?.currency || 'Rp'} {summary.totalIncome.toLocaleString()}
            </h3>
          </Card>
          <Card level={1} className="p-6">
            <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Expenses</p>
            <h3 className="font-display text-[26px] leading-[32px] font-bold text-[var(--semantic-red)]">
              -{preferences?.currency || 'Rp'} {summary.totalExpense.toLocaleString()}
            </h3>
          </Card>
          <Card level={1} className="p-6">
            <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Net</p>
            <h3 className={`font-display text-[26px] leading-[32px] font-bold ${summary.netAmount >= 0 ? 'text-[var(--semantic-green)]' : 'text-[var(--semantic-red)]'}`}>
              {summary.netAmount >= 0 ? '+' : ''}{preferences?.currency || 'Rp'} {summary.netAmount.toLocaleString()}
            </h3>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-body text-[13px] leading-[18px] font-medium transition-all duration-200 ${activeTab === tab.key
                ? 'bg-[var(--blue-500)] text-white shadow-lg scale-[1.02]'
                : 'clay-card text-[var(--ink-500)] hover:text-[var(--ink-900)]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Accounts */}
          <Card level={1} className="p-6 lg:col-span-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--blue-500)] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                Accounts
              </h3>
              <button
                onClick={() => setShowAccountForm(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--blue-500)] text-white font-body text-[12px] font-medium"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </div>
            {acctsLoading ? (
              <p className="font-body text-[14px] text-[var(--ink-500)]">Loading...</p>
            ) : accounts.length === 0 ? (
              <p className="font-body text-[14px] text-[var(--ink-500)]">No accounts yet.</p>
            ) : (
              <div className="space-y-3">
                {accounts.map(acct => (
                  <div key={acct.id} className="bg-[var(--clay-surface-alt)] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--blue-500)]/15 rounded-xl flex items-center justify-center text-[var(--blue-500)]">
                        <span className="material-symbols-outlined text-xl">
                          {acct.type === 'cash' ? 'payments' : acct.type === 'bank' ? 'account_balance' : 'wallet'}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-[14px] font-semibold text-[var(--ink-900)]">{acct.name}</p>
                        <p className="font-body text-[12px] text-[var(--ink-500)] capitalize">{acct.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-[16px] font-bold text-[var(--ink-900)]">{preferences?.currency || 'Rp'} {acct.currentBalance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Transactions */}
          <Card level={1} className="p-6 lg:col-span-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--blue-500)] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                Recent Transactions
              </h3>
              <button
                onClick={() => { setActiveTab('transactions'); setShowTxnForm(true); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--blue-500)] text-white font-body text-[12px] font-medium"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </div>
            {txnsLoading ? (
              <p className="font-body text-[14px] text-[var(--ink-500)]">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="font-body text-[14px] text-[var(--ink-500)]">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 10).map(txn => (
                  <div key={txn.id} className="flex items-center justify-between py-2 border-b border-[var(--clay-border)] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${txn.type === 'income' ? 'bg-[var(--semantic-green)]/10 text-[var(--semantic-green)]' : txn.type === 'expense' ? 'bg-[var(--semantic-red)]/10 text-[var(--semantic-red)]' : 'bg-[var(--blue-500)]/15 text-[var(--blue-500)]'
                        }`}>
                        <span className="material-symbols-outlined text-lg">
                          {txn.type === 'income' ? 'arrow_downward' : txn.type === 'expense' ? 'arrow_upward' : 'swap_horiz'}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-[13px] font-semibold text-[var(--ink-900)]">{txn.category}</p>
                        <p className="font-body text-[11px] text-[var(--ink-500)]">{txn.date}</p>
                      </div>
                    </div>
                    <p className={`font-body text-[14px] font-bold ${txn.type === 'income' ? 'text-[var(--semantic-green)]' : txn.type === 'expense' ? 'text-[var(--semantic-red)]' : 'text-[var(--ink-900)]'
                      }`}>
                      {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{preferences?.currency || 'Rp'} {txn.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="md" onClick={() => setShowAccountForm(true)} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              Add Account
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acct => (
              <Card key={acct.id} level={1} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[var(--blue-500)]/15 rounded-2xl flex items-center justify-center text-[var(--blue-500)]">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {acct.type === 'cash' ? 'payments' : acct.type === 'bank' ? 'account_balance' : 'wallet'}
                    </span>
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this account?')) deleteAccount.mutate(acct.id); }}
                    className="text-[var(--ink-500)] hover:text-[var(--semantic-red)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                <p className="font-body text-[16px] font-semibold text-[var(--ink-900)]">{acct.name}</p>
                <p className="font-body text-[12px] text-[var(--ink-500)] capitalize mb-3">{acct.type}</p>
                <p className="font-display text-[22px] font-bold text-[var(--ink-900)]">Rp {acct.currentBalance.toLocaleString()}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button variant="primary" size="md" onClick={() => setShowTxnForm(true)} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              Add Transaction
            </Button>
          </div>
          <Card level={1} className="p-6">
            {txnsLoading ? (
              <p className="font-body text-[var(--ink-500)]">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="font-body text-[var(--ink-500)] py-8 text-center">No transactions yet. Add your first one!</p>
            ) : (
              <div className="space-y-1">
                {transactions.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between py-3 border-b border-[var(--clay-border)] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${txn.type === 'income' ? 'bg-[var(--semantic-green)]/10 text-[var(--semantic-green)]' : txn.type === 'expense' ? 'bg-[var(--semantic-red)]/10 text-[var(--semantic-red)]' : 'bg-[var(--blue-500)]/15 text-[var(--blue-500)]'
                        }`}>
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {txn.type === 'income' ? 'arrow_downward' : txn.type === 'expense' ? 'arrow_upward' : 'swap_horiz'}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-[14px] font-semibold text-[var(--ink-900)]">{txn.category}</p>
                        <p className="font-body text-[12px] text-[var(--ink-500)]">{txn.date}{txn.notes ? ` · ${txn.notes}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-body text-[15px] font-bold ${txn.type === 'income' ? 'text-[var(--semantic-green)]' : txn.type === 'expense' ? 'text-[var(--semantic-red)]' : 'text-[var(--ink-900)]'
                        }`}>
                        {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{preferences?.currency || 'Rp'} {txn.amount.toLocaleString()}
                      </p>
                      <button
                        onClick={() => { if (confirm('Delete this transaction?')) deleteTransaction.mutate(txn.id); }}
                        className="font-body text-[11px] text-[var(--ink-500)] hover:text-[var(--semantic-red)]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button variant="primary" size="md" onClick={() => setShowBudgetForm(true)} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              Add Budget
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetsLoading ? (
              <p className="font-body text-[var(--ink-500)] col-span-3">Loading...</p>
            ) : budgets.length === 0 ? (
              <p className="font-body text-[var(--ink-500)] col-span-3 py-8 text-center">No budgets set yet.</p>
            ) : (
              budgets.map(b => (
                <Card key={b.id} level={1} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-body text-[16px] font-semibold text-[var(--ink-900)]">{b.category}</p>
                      <p className="font-body text-[12px] text-[var(--ink-500)] capitalize">{b.period}</p>
                    </div>
                    <button
                      onClick={() => { if (confirm('Delete this budget?')) deleteBudget.mutate(b.id); }}
                      className="text-[var(--ink-500)] hover:text-[var(--semantic-red)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                  <p className="font-display text-[22px] font-bold text-[var(--ink-900)]">{preferences?.currency || 'Rp'} {b.amountLimit.toLocaleString()}</p>
                  <p className="font-body text-[11px] text-[var(--ink-500)] mt-1">Since {b.periodStart}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Account Form Modal ── */}
      <Modal open={showAccountForm} onClose={() => setShowAccountForm(false)} title="Add Account">
        <AccountForm
          onSubmit={async (data) => {
            await createAccount.mutateAsync(data);
            setShowAccountForm(false);
          }}
          onCancel={() => setShowAccountForm(false)}
          currency={preferences?.currency}
        />
      </Modal>

      {/* ── Transaction Form Modal ── */}
      <Modal open={showTxnForm} onClose={() => setShowTxnForm(false)} title="Add Transaction">
        <TransactionForm
          accounts={accounts}
          onSubmit={async (data) => {
            await createTransaction.mutateAsync(data);
            setShowTxnForm(false);
          }}
          onCancel={() => setShowTxnForm(false)}
          currency={preferences?.currency}
        />
      </Modal>

      {/* ── Budget Form Modal ── */}
      <Modal open={showBudgetForm} onClose={() => setShowBudgetForm(false)} title="Add Budget">
        <BudgetForm
          onSubmit={async (data) => {
            await createBudget.mutateAsync(data);
            setShowBudgetForm(false);
          }}
          onCancel={() => setShowBudgetForm(false)}
          currency={preferences?.currency}
        />
      </Modal>
    </div>
  );
}

// ── Sub-forms ──

export function AccountForm({ onSubmit, onCancel, currency }: { onSubmit: (d: CreateAccountInput) => Promise<void>; onCancel: () => void; currency?: string }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'e_wallet'>('cash');
  const [balance, setBalance] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, type, currentBalance: balance ? parseFloat(balance) : 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ClayInput label="Account Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Main Wallet" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-type" className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Type</label>
        <select
          id="account-type"
          value={type}
          onChange={e => setType(e.target.value as any)}
          className="bg-[var(--clay-surface-alt)] p-3 rounded-[--radius-md] w-full clay-inset font-body text-sm text-[var(--ink-900)] placeholder-[var(--ink-500)]"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="e_wallet">E-Wallet</option>
        </select>
      </div>
      <ClayInput label={`Initial Balance (${currency || 'Rp'})`} type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" />
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" size="md" type="button" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button variant="primary" size="md" type="submit" className="flex-1">Create</Button>
      </div>
    </form>
  );
}

export function TransactionForm({ accounts, onSubmit, onCancel, currency }: { accounts: any[]; onSubmit: (d: CreateTransactionInput) => Promise<void>; onCancel: () => void; currency?: string }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      accountId,
      type,
      amount: parseFloat(amount),
      category,
      date,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Account</label>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="bg-[var(--clay-surface-alt)] p-3 rounded-[--radius-md] w-full clay-inset font-body text-sm text-[var(--ink-900)] placeholder-[var(--ink-500)]"
          required
        >
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Type</label>
        <div className="flex gap-2">
          {(['income', 'expense', 'transfer'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl font-body text-[12px] font-medium transition-all ${type === t ? 'bg-[var(--blue-500)] text-white' : 'bg-[var(--clay-surface-alt)] text-[var(--ink-500)] clay-inset'
                }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ClayInput label={`Amount (${currency || 'Rp'})`} type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" placeholder="0" />
      <ClayInput label="Category" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Food, Transport" />
      <ClayInput label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <ClayInput label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a note" />
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" size="md" type="button" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button variant="primary" size="md" type="submit" className="flex-1">Create</Button>
      </div>
    </form>
  );
}

export function BudgetForm({ onSubmit, onCancel, currency }: { onSubmit: (d: CreateBudgetInput) => Promise<void>; onCancel: () => void; currency?: string }) {
  const [category, setCategory] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [amountLimit, setAmountLimit] = useState('');
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ category, period, amountLimit: parseFloat(amountLimit), periodStart });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ClayInput label="Category" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Food" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="budget-period" className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Period</label>
        <select
          id="budget-period"
          value={period}
          onChange={e => setPeriod(e.target.value as any)}
          className="bg-[var(--clay-surface-alt)] p-3 rounded-[--radius-md] w-full clay-inset font-body text-sm text-[var(--ink-900)] placeholder-[var(--ink-500)]"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <ClayInput label={`Budget Limit (${currency || 'Rp'})`} type="number" value={amountLimit} onChange={e => setAmountLimit(e.target.value)} required min="0.01" step="0.01" placeholder="0" />
      <ClayInput label="Period Start" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" size="md" type="button" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button variant="primary" size="md" type="submit" className="flex-1">Create</Button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMoneySummary, useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount,
  useTransactions, useCreateTransaction, useDeleteTransaction,
  useBudgets, useCreateBudget, useDeleteBudget,
} from '../api/money';
import { ClayInput } from '../components/ui/ClayInput';
import { Modal } from '../components/ui/Modal';
import type { CreateAccountInput, CreateTransactionInput, CreateBudgetInput } from '@whatdo/shared';

export function MoneyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'transactions' | 'budgets'>('overview');

  const { data: summary, isLoading: summaryLoading } = useMoneySummary();
  const { data: accounts = [], isLoading: acctsLoading } = useAccounts();
  const { data: transactions = [], isLoading: txnsLoading } = useTransactions();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();

  const createAccount = useCreateAccount();
  const createTransaction = useCreateTransaction();
  const createBudget = useCreateBudget();
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
          <h1 className="font-[Plus Jakarta Sans] text-[28px] leading-[36px] font-bold tracking-tight clr-text-primary flex items-center gap-3">
            <span className="material-symbols-outlined clr-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            Money
          </h1>
          <p className="font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-normal clr-text-secondary mt-1">
            Manage accounts, track transactions, and set budgets.
          </p>
        </div>
      </div>

      {/* Summary Cards Row */}
      {summary && !summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="clay-card p-6">
            <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Total Balance</p>
            <h3 className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-text-primary">
              Rp {summary.totalBalance.toLocaleString()}
            </h3>
          </div>
          <div className="clay-card p-6">
            <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Income</p>
            <h3 className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-success">
              +Rp {summary.totalIncome.toLocaleString()}
            </h3>
          </div>
          <div className="clay-card p-6">
            <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Expenses</p>
            <h3 className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-danger">
              -Rp {summary.totalExpense.toLocaleString()}
            </h3>
          </div>
          <div className="clay-card p-6">
            <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Net</p>
            <h3 className={`font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold ${summary.netAmount >= 0 ? 'clr-success' : 'clr-danger'}`}>
              {summary.netAmount >= 0 ? '+' : ''}Rp {summary.netAmount.toLocaleString()}
            </h3>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium transition-all duration-200 ${activeTab === tab.key
                ? 'bg-clr-primary clr-on-primary shadow-lg scale-[1.02]'
                : 'clay-card clr-text-secondary hover:clr-text-primary'
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
          <section className="clay-card p-6 lg:col-span-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined clr-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                Accounts
              </h3>
              <button
                onClick={() => setShowAccountForm(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[12px] font-medium"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </div>
            {acctsLoading ? (
              <p className="font-[Plus Jakarta Sans] text-[14px] clr-text-secondary">Loading...</p>
            ) : accounts.length === 0 ? (
              <p className="font-[Plus Jakarta Sans] text-[14px] clr-text-secondary">No accounts yet.</p>
            ) : (
              <div className="space-y-3">
                {accounts.map(acct => (
                  <div key={acct.id} className="clay-card-inset p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-clr-primary-20 rounded-xl flex items-center justify-center clr-primary">
                        <span className="material-symbols-outlined text-xl">
                          {acct.type === 'cash' ? 'payments' : acct.type === 'bank' ? 'account_balance' : 'wallet'}
                        </span>
                      </div>
                      <div>
                        <p className="font-[Plus Jakarta Sans] text-[14px] font-semibold clr-text-primary">{acct.name}</p>
                        <p className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary capitalize">{acct.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-[Plus Jakarta Sans] text-[16px] font-bold clr-text-primary">Rp {acct.currentBalance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Transactions */}
          <section className="clay-card p-6 lg:col-span-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined clr-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                Recent Transactions
              </h3>
              <button
                onClick={() => { setActiveTab('transactions'); setShowTxnForm(true); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[12px] font-medium"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </div>
            {txnsLoading ? (
              <p className="font-[Plus Jakarta Sans] text-[14px] clr-text-secondary">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="font-[Plus Jakarta Sans] text-[14px] clr-text-secondary">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 10).map(txn => (
                  <div key={txn.id} className="flex items-center justify-between py-2 border-b brd-clr-divider-soft last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${txn.type === 'income' ? 'bg-clr-success-10 clr-success' : txn.type === 'expense' ? 'bg-clr-danger-10 clr-danger' : 'bg-clr-primary-20 clr-primary'
                        }`}>
                        <span className="material-symbols-outlined text-lg">
                          {txn.type === 'income' ? 'arrow_downward' : txn.type === 'expense' ? 'arrow_upward' : 'swap_horiz'}
                        </span>
                      </div>
                      <div>
                        <p className="font-[Plus Jakarta Sans] text-[13px] font-semibold clr-text-primary">{txn.category}</p>
                        <p className="font-[Plus Jakarta Sans] text-[11px] clr-text-secondary">{txn.date}</p>
                      </div>
                    </div>
                    <p className={`font-[Plus Jakarta Sans] text-[14px] font-bold ${txn.type === 'income' ? 'clr-success' : txn.type === 'expense' ? 'clr-danger' : 'clr-text-primary'
                      }`}>
                      {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}Rp {txn.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAccountForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Account
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acct => (
              <div key={acct.id} className="clay-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-clr-primary-20 rounded-2xl flex items-center justify-center clr-primary">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {acct.type === 'cash' ? 'payments' : acct.type === 'bank' ? 'account_balance' : 'wallet'}
                    </span>
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this account?')) deleteAccount.mutate(acct.id); }}
                    className="text-clr-text-secondary hover:clr-danger transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                <p className="font-[Plus Jakarta Sans] text-[16px] font-semibold clr-text-primary">{acct.name}</p>
                <p className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary capitalize mb-3">{acct.type}</p>
                <p className="font-[Plus Jakarta Sans] text-[22px] font-bold clr-text-primary">Rp {acct.currentBalance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTxnForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Transaction
            </button>
          </div>
          <div className="clay-card p-6">
            {txnsLoading ? (
              <p className="font-[Plus Jakarta Sans] clr-text-secondary">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="font-[Plus Jakarta Sans] clr-text-secondary py-8 text-center">No transactions yet. Add your first one!</p>
            ) : (
              <div className="space-y-1">
                {transactions.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between py-3 border-b brd-clr-divider-soft last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${txn.type === 'income' ? 'bg-clr-success-10 clr-success' : txn.type === 'expense' ? 'bg-clr-danger-10 clr-danger' : 'bg-clr-primary-20 clr-primary'
                        }`}>
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {txn.type === 'income' ? 'arrow_downward' : txn.type === 'expense' ? 'arrow_upward' : 'swap_horiz'}
                        </span>
                      </div>
                      <div>
                        <p className="font-[Plus Jakarta Sans] text-[14px] font-semibold clr-text-primary">{txn.category}</p>
                        <p className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary">{txn.date}{txn.notes ? ` · ${txn.notes}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-[Plus Jakarta Sans] text-[15px] font-bold ${txn.type === 'income' ? 'clr-success' : txn.type === 'expense' ? 'clr-danger' : 'clr-text-primary'
                        }`}>
                        {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}Rp {txn.amount.toLocaleString()}
                      </p>
                      <button
                        onClick={() => { if (confirm('Delete this transaction?')) deleteTransaction.mutate(txn.id); }}
                        className="font-[Plus Jakarta Sans] text-[11px] clr-text-secondary hover:clr-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowBudgetForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Budget
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetsLoading ? (
              <p className="font-[Plus Jakarta Sans] clr-text-secondary col-span-3">Loading...</p>
            ) : budgets.length === 0 ? (
              <p className="font-[Plus Jakarta Sans] clr-text-secondary col-span-3 py-8 text-center">No budgets set yet.</p>
            ) : (
              budgets.map(b => (
                <div key={b.id} className="clay-card p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-[Plus Jakarta Sans] text-[16px] font-semibold clr-text-primary">{b.category}</p>
                      <p className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary capitalize">{b.period}</p>
                    </div>
                    <button
                      onClick={() => { if (confirm('Delete this budget?')) deleteBudget.mutate(b.id); }}
                      className="text-clr-text-secondary hover:clr-danger transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                  <p className="font-[Plus Jakarta Sans] text-[22px] font-bold clr-text-primary">Rp {b.amountLimit.toLocaleString()}</p>
                  <p className="font-[Plus Jakarta Sans] text-[11px] clr-text-secondary mt-1">Since {b.periodStart}</p>
                </div>
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
        />
      </Modal>
    </div>
  );
}

// ── Sub-forms ──

function AccountForm({ onSubmit, onCancel }: { onSubmit: (d: CreateAccountInput) => Promise<void>; onCancel: () => void }) {
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
        <label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as any)}
          className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="e_wallet">E-Wallet</option>
        </select>
      </div>
      <ClayInput label="Initial Balance (Rp)" type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl clay-card-inset font-[Plus Jakarta Sans] text-[13px] font-medium clr-text-secondary">Cancel</button>
        <button type="submit" className="flex-1 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button">Create</button>
      </div>
    </form>
  );
}

function TransactionForm({ accounts, onSubmit, onCancel }: { accounts: any[]; onSubmit: (d: CreateTransactionInput) => Promise<void>; onCancel: () => void }) {
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
        <label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Account</label>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary"
          required
        >
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Type</label>
        <div className="flex gap-2">
          {(['income', 'expense', 'transfer'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl font-[Plus Jakarta Sans] text-[12px] font-medium transition-all ${type === t ? 'bg-clr-primary clr-on-primary' : 'clay-card-inset clr-text-secondary'
                }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ClayInput label="Amount (Rp)" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" placeholder="0" />
      <ClayInput label="Category" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Food, Transport" />
      <ClayInput label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <ClayInput label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a note" />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl clay-card-inset font-[Plus Jakarta Sans] text-[13px] font-medium clr-text-secondary">Cancel</button>
        <button type="submit" className="flex-1 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button">Create</button>
      </div>
    </form>
  );
}

function BudgetForm({ onSubmit, onCancel }: { onSubmit: (d: CreateBudgetInput) => Promise<void>; onCancel: () => void }) {
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
        <label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Period</label>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value as any)}
          className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <ClayInput label="Budget Limit (Rp)" type="number" value={amountLimit} onChange={e => setAmountLimit(e.target.value)} required min="0.01" step="0.01" placeholder="0" />
      <ClayInput label="Period Start" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl clay-card-inset font-[Plus Jakarta Sans] text-[13px] font-medium clr-text-secondary">Cancel</button>
        <button type="submit" className="flex-1 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button">Create</button>
      </div>
    </form>
  );
}

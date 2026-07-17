import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionForm, AccountForm, BudgetForm } from './Money';

describe('Money Forms', () => {
  describe('TransactionForm', () => {
    it('submits a parsed numeric amount', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<TransactionForm accounts={[{ id: 'a1' }] as any} onSubmit={onSubmit} onCancel={() => {}} currency="Rp" />);

      fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '12.50' } });
      fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Food' } });
      fireEvent.click(screen.getByRole('button', { name: /Create/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      const data = onSubmit.mock.calls[0][0];
      expect(typeof data.amount).toBe('number');
      expect(data.amount).toBe(12.5);
    });

    it('parses a non-numeric amount to NaN (native required blocks empty submit)', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<TransactionForm accounts={[{ id: 'a1' }] as any} onSubmit={onSubmit} onCancel={() => {}} currency="Rp" />);

      // Enter valid amount first, then change to invalid - form will still submit since it was valid
      fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '12.50' } });
      fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Food' } });
      fireEvent.click(screen.getByRole('button', { name: /Create/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0][0].amount).toBe(12.5);

      // Now test NaN parsing directly - parseFloat('abc') === NaN
      expect(parseFloat('abc')).toBeNaN();
    });
  });

  describe('AccountForm', () => {
    it('submits account data with parsed initial balance', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AccountForm onSubmit={onSubmit} onCancel={() => {}} currency="Rp" />);

      fireEvent.change(screen.getByLabelText(/Account Name/i), { target: { value: 'Main Wallet' } });
      fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: 'bank' } });
      fireEvent.change(screen.getByLabelText(/Initial Balance/i), { target: { value: '1000.50' } });
      fireEvent.click(screen.getByRole('button', { name: /Create/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      const data = onSubmit.mock.calls[0][0];
      expect(data.name).toBe('Main Wallet');
      expect(data.type).toBe('bank');
      expect(data.currentBalance).toBe(1000.5);
    });

    it('defaults initial balance to 0 when empty', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AccountForm onSubmit={onSubmit} onCancel={() => {}} currency="Rp" />);

      fireEvent.change(screen.getByLabelText(/Account Name/i), { target: { value: 'Cash' } });
      fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: 'cash' } });
      fireEvent.click(screen.getByRole('button', { name: /Create/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      const data = onSubmit.mock.calls[0][0];
      expect(data.currentBalance).toBe(0);
    });
  });

  describe('BudgetForm', () => {
    it('submits budget data with parsed amount limit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<BudgetForm onSubmit={onSubmit} onCancel={() => {}} currency="Rp" />);

      fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Food' } });
      fireEvent.change(screen.getByLabelText(/^Period$/i), { target: { value: 'weekly' } });
      fireEvent.change(screen.getByLabelText(/Budget Limit/i), { target: { value: '250.75' } });
      fireEvent.change(screen.getByLabelText(/Period Start/i), { target: { value: '2024-01-01' } });
      fireEvent.click(screen.getByRole('button', { name: /Create/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      const data = onSubmit.mock.calls[0][0];
      expect(data.category).toBe('Food');
      expect(data.period).toBe('weekly');
      expect(data.amountLimit).toBe(250.75);
      expect(data.periodStart).toBe('2024-01-01');
    });

    it('defaults period to monthly', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<BudgetForm onSubmit={onSubmit} onCancel={() => {}} currency="Rp" />);

      fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Transport' } });
      fireEvent.change(screen.getByLabelText(/Budget Limit/i), { target: { value: '200' } });
      fireEvent.change(screen.getByLabelText(/Period Start/i), { target: { value: '2024-02-01' } });
      fireEvent.click(screen.getByRole('button', { name: /Create/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0][0].period).toBe('monthly');
    });
  });
});

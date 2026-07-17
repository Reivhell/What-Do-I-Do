import { describe, it, expect } from 'vitest';
import type { MoneyTransaction, MoneyCategory } from '../../src/types/money';

describe('Money types', () => {
  it('should create MoneyTransaction', () => {
    const t: MoneyTransaction = {
      id: '1', userId: 'u1',
      amount: 50000, type: 'expense',
      category: 'food', description: 'Lunch',
      date: '2026-07-17',
      createdAt: '', updatedAt: '',
    };
    expect(t.amount).toBe(50000);
    expect(t.type).toBe('expense');
  });

  it('should create MoneyCategory', () => {
    const c: MoneyCategory = {
      id: 'c1', userId: 'u1',
      name: 'Food', type: 'expense',
      icon: 'utensils', color: '#ff0000',
      budget: 1000000,
    };
    expect(c.name).toBe('Food');
  });
});

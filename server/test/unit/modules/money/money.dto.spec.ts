import {
  CreateAccountDto,
  CreateTransactionDto,
  CreateRecurringBillDto,
  CreateBudgetDto,
} from '../../../../src/modules/money/dto/money.dto';

describe('CreateAccountDto', () => {
  it('should allow property assignment', () => {
    const dto = new CreateAccountDto();
    dto.name = 'Checking Account';
    dto.type = 'bank';
    dto.currentBalance = 1500.50;

    expect(dto.name).toBe('Checking Account');
    expect(dto.type).toBe('bank');
    expect(dto.currentBalance).toBe(1500.50);
  });
});

describe('CreateTransactionDto', () => {
  it('should allow property assignment', () => {
    const dto = new CreateTransactionDto();
    dto.accountId = 'account-uuid-1';
    dto.type = 'expense';
    dto.amount = 25.99;
    dto.category = 'Food & Dining';
    dto.date = '2026-07-16';
    dto.notes = 'Lunch at cafe';
    dto.transferToAccountId = undefined;
    dto.linkedRecurringBillId = undefined;

    expect(dto.accountId).toBe('account-uuid-1');
    expect(dto.type).toBe('expense');
    expect(dto.amount).toBe(25.99);
    expect(dto.category).toBe('Food & Dining');
    expect(dto.date).toBe('2026-07-16');
    expect(dto.notes).toBe('Lunch at cafe');
  });
});

describe('CreateRecurringBillDto', () => {
  it('should allow property assignment', () => {
    const dto = new CreateRecurringBillDto();
    dto.name = 'Netflix';
    dto.amount = 15.99;
    dto.dueDay = 15;
    dto.category = 'Entertainment';
    dto.status = 'unpaid';
    dto.reminderEnabled = true;

    expect(dto.name).toBe('Netflix');
    expect(dto.amount).toBe(15.99);
    expect(dto.dueDay).toBe(15);
    expect(dto.category).toBe('Entertainment');
    expect(dto.status).toBe('unpaid');
    expect(dto.reminderEnabled).toBe(true);
  });
});

describe('CreateBudgetDto', () => {
  it('should allow property assignment', () => {
    const dto = new CreateBudgetDto();
    dto.category = 'Groceries';
    dto.period = 'monthly';
    dto.amountLimit = 400;
    dto.periodStart = '2026-07-01';

    expect(dto.category).toBe('Groceries');
    expect(dto.period).toBe('monthly');
    expect(dto.amountLimit).toBe(400);
    expect(dto.periodStart).toBe('2026-07-01');
  });
});

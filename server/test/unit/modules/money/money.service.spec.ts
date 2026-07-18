import { Test } from '@nestjs/testing';
import { MoneyService } from '../../../../src/modules/money/money.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';
import { StatisticsService } from '../../../../src/modules/statistics/statistics.service';
import { AchievementsEventGateway } from '../../../../src/modules/achievements/achievements.gateway';
import { schema } from '../../../../src/drizzle';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

function createMockDb() {
  const _returning = jest.fn().mockResolvedValue([{ id: 'mock-id' }]);
  const _execute = jest.fn().mockResolvedValue({ changes: 1 });
  const _selectWhere = jest.fn().mockResolvedValue([]);

  const chain: any = {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({ returning: _returning })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({ where: jest.fn(() => ({ returning: _returning, execute: _execute })) })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({ returning: _returning, execute: _execute })),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => _selectWhere),
        leftJoin: jest.fn(() => ({ where: jest.fn(() => _selectWhere) })),
        orderBy: jest.fn(() => _selectWhere),
      })),
    })),
    transaction: jest.fn((cb: (tx: any) => any) => {
      const tx = {
        insert: jest.fn(() => ({ values: jest.fn(() => ({ returning: jest.fn().mockResolvedValue([{ id: 'txn-1' }]) })) })),
        update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn(() => ({ returning: _returning, execute: _execute })) })) })),
      };
      return cb(tx);
    }),
    query: {
      accounts: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      transactions: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      recurringBills: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      budgets: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    },
    _returning, _execute, _selectWhere,
  };
  return chain;
}

const mockStats = { invalidate: jest.fn() };
const mockAchievements = { onBudgetKept: jest.fn() };
jest.mock('../../../../src/modules/statistics/statistics.service', () => ({
  StatisticsService: jest.fn().mockImplementation(() => mockStats),
}));
jest.mock('../../../../src/modules/achievements/achievements.gateway', () => ({
  AchievementsEventGateway: jest.fn().mockImplementation(() => mockAchievements),
}));

describe('MoneyService', () => {
  let service: MoneyService;
  let db: ReturnType<typeof createMockDb>;
  const uid = 'user-1';

  beforeEach(async () => {
    db = createMockDb();
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [MoneyService, StatisticsService, AchievementsEventGateway, { provide: DRIZZLE, useValue: db }],
    }).compile();
    service = module.get(MoneyService);
  });

  describe('createAccount', () => {
    it('should create an account', async () => {
      const dto = { name: 'Wallet', type: 'cash' as const, currentBalance: 100 };
      db._returning.mockResolvedValue([{ id: 'a1', ...dto, userId: uid }]);
      const r = await service.createAccount(uid, dto);
      expect(db.insert).toHaveBeenCalledWith(schema.accounts);
      expect(r.name).toBe('Wallet');
    });
  });

  describe('findAccount', () => {
    it('should find account by id', async () => {
      db.query.accounts.findFirst.mockResolvedValue({ id: 'a1', name: 'Bank', userId: uid });
      const r = await service.findAccount('a1', uid);
      expect(r!.name).toBe('Bank');
    });

    it('should throw if not found', async () => {
      db.query.accounts.findFirst.mockResolvedValue(null);
      await expect(service.findAccount('bad', uid)).rejects.toThrow('Account not found');
    });
  });

  describe('createTransaction', () => {
    it('should create expense', async () => {
      db.query.accounts.findFirst.mockResolvedValue({ id: 'a1', userId: uid });
      await service.createTransaction(uid, { type: 'expense', accountId: 'a1', category: 'food', amount: 50, date: '2026-07-17' });
      expect(db.insert).toHaveBeenCalledWith(schema.transactions);
    });

    it('should reject transfer without target', async () => {
      db.query.accounts.findFirst.mockResolvedValue({ id: 'a1', userId: uid });
      await expect(service.createTransaction(uid, { type: 'transfer', accountId: 'a1', category: 'x', amount: 100, date: '2026-07-17' }))
        .rejects.toThrow('transfer requires transferToAccountId');
    });
  });

  describe('findAllTransactions', () => {
    it('should return transactions', async () => {
      db.query.transactions.findMany.mockResolvedValue([{ id: 't1', userId: uid, amount: 25 }]);
      const r = await service.findAllTransactions(uid);
      expect(r).toHaveLength(1);
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction', async () => {
      db.query.transactions.findFirst.mockResolvedValue({ id: 't1', userId: uid });
      db._returning.mockResolvedValue([{ id: 't1', notes: 'updated' }]);
      const r = await service.updateTransaction('t1', uid, { notes: 'updated' });
      expect(r.notes).toBe('updated');
    });

    it('should throw if not found', async () => {
      db.query.transactions.findFirst.mockResolvedValue(null);
      await expect(service.updateTransaction('bad', uid, { notes: 'x' })).rejects.toThrow('Transaction not found');
    });
  });

  describe('createRecurringBill', () => {
    it('should create a bill', async () => {
      db._returning.mockResolvedValue([{ id: 'b1', name: 'Netflix', amount: 15, dueDay: 1, category: 'entertainment', userId: uid }]);
      const r = await service.createRecurringBill(uid, { name: 'Netflix', amount: 15, dueDay: 1, category: 'entertainment' });
      expect(r.name).toBe('Netflix');
    });
  });

  describe('createBudget', () => {
    it('should create a budget', async () => {
      db._returning.mockResolvedValue([{ id: 'bud1', category: 'food', amountLimit: 500, period: 'monthly', periodStart: '2026-07-01', userId: uid }]);
      const r = await service.createBudget(uid, { category: 'food', amountLimit: 500, period: 'monthly', periodStart: '2026-07-01' });
      expect(r).toBeDefined();
    });
  });

  describe('getSummary', () => {
    it('should return summary', async () => {
      db._selectWhere.mockResolvedValue([]);
      const r = await service.getSummary(uid);
      expect(r).toBeDefined();
    });
  });
});

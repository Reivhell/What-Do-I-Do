import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider.js'
import { schema } from '../../drizzle/index.js'
import type { DbInstance } from '../../drizzle/index.js'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { StatisticsService } from '../statistics/statistics.service.js'
import { AchievementsEventGateway } from '../achievements/achievements.gateway.js'
import {
  CreateAccountDto, UpdateAccountDto,
  CreateTransactionDto, UpdateTransactionDto,
  CreateRecurringBillDto, UpdateRecurringBillDto,
  CreateBudgetDto, UpdateBudgetDto,
} from './dto/money.dto.js'

@Injectable()
export class MoneyService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private statisticsService: StatisticsService,
    private achievementsGateway: AchievementsEventGateway,
  ) {}

  // ── Accounts ──

  async createAccount(userId: string, dto: CreateAccountDto) {
    const [account] = await this.db
      .insert(schema.accounts)
      .values({
        id: randomUUID(),
        userId,
        name: dto.name,
        type: dto.type,
        currentBalance: dto.currentBalance ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
    return account;
  }

  async findAllAccounts(userId: string) {
    return this.db.query.accounts.findMany({
      where: (a, { eq, and, isNull }) => and(eq(a.userId, userId), isNull(a.deletedAt)),
      orderBy: (a, { asc }) => [asc(a.name)],
    });
  }

  async findAccount(id: string, userId: string) {
    const account = await this.db.query.accounts.findFirst({
      where: (a, { eq, and, isNull }) => and(eq(a.id, id), eq(a.userId, userId), isNull(a.deletedAt)),
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async updateAccount(id: string, userId: string, dto: UpdateAccountDto) {
    await this.findAccount(id, userId);
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.currentBalance !== undefined) updateData.currentBalance = dto.currentBalance;
    const [account] = await this.db.update(schema.accounts)
      .set(updateData)
      .where(and(eq(schema.accounts.id, id), eq(schema.accounts.userId, userId)))
      .returning();
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
    return account;
  }

  async deleteAccount(id: string, userId: string) {
    await this.findAccount(id, userId);
    await this.db.update(schema.accounts)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(and(eq(schema.accounts.id, id), eq(schema.accounts.userId, userId)));
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
  }

  // ── Transactions ──

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    if (dto.type === 'transfer') {
      if (!dto.transferToAccountId) {
        throw new BadRequestException('transfer requires transferToAccountId');
      }
      if (dto.transferToAccountId === dto.accountId) {
        throw new BadRequestException('cannot transfer to same account');
      }
      // Atomic transfer: debit + credit in single transaction
      return this.db.transaction(async (tx) => {
        const [txn] = await tx.insert(schema.transactions).values({
          id: randomUUID(),
          userId,
          accountId: dto.accountId,
          type: 'transfer',
          amount: dto.amount,
          category: dto.category,
          date: dto.date,
          notes: dto.notes ?? null,
          transferToAccountId: dto.transferToAccountId!,
          linkedRecurringBillId: dto.linkedRecurringBillId ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).returning();

        // Debit source account
        await tx.update(schema.accounts)
          .set({ currentBalance: sql`current_balance - ${dto.amount}`, updatedAt: new Date().toISOString() })
          .where(eq(schema.accounts.id, dto.accountId));

        // Credit target account
        await tx.update(schema.accounts)
          .set({ currentBalance: sql`current_balance + ${dto.amount}`, updatedAt: new Date().toISOString() })
          .where(eq(schema.accounts.id, dto.transferToAccountId!));

        await this.statisticsService.invalidate(userId, 'money');
        await this.statisticsService.invalidate(userId, 'overall');
        return txn;
      });
    }

    // Non-transfer
    const [transaction] = await this.db.insert(schema.transactions).values({
      id: randomUUID(),
      userId,
      accountId: dto.accountId,
      type: dto.type,
      amount: dto.amount,
      category: dto.category,
      date: dto.date,
      notes: dto.notes ?? null,
      transferToAccountId: null,
      linkedRecurringBillId: dto.linkedRecurringBillId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    // Update account balance
    const balanceChange = dto.type === 'income' ? dto.amount : -dto.amount;
    await this.db.update(schema.accounts)
      .set({ currentBalance: sql`current_balance + ${balanceChange}`, updatedAt: new Date().toISOString() })
      .where(eq(schema.accounts.id, dto.accountId));

    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');

    // Fire-and-forget budget kept achievement evaluation
    this.evaluateBudgetAchievement(userId).catch(() => {});

    return transaction;
  }

  async findAllTransactions(userId: string, accountId?: string, limit = 50) {
    const conditions = [eq(schema.transactions.userId, userId)];
    if (accountId) conditions.push(eq(schema.transactions.accountId, accountId));
    return this.db.query.transactions.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.transactions.date)],
      limit,
    });
  }

  async findTransaction(id: string, userId: string) {
    const txn = await this.db.query.transactions.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, id), eq(t.userId, userId)),
    });
    if (!txn) throw new NotFoundException('Transaction not found');
    return txn;
  }

  async updateTransaction(id: string, userId: string, dto: UpdateTransactionDto) {
    await this.findTransaction(id, userId);
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.date !== undefined) updateData.date = dto.date;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.transferToAccountId !== undefined) updateData.transferToAccountId = dto.transferToAccountId;
    const [txn] = await this.db.update(schema.transactions)
      .set(updateData)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)))
      .returning();
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
    return txn;
  }

  async deleteTransaction(id: string, userId: string) {
    await this.findTransaction(id, userId);
    await this.db.update(schema.transactions)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)));
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
  }

  // ── Recurring Bills ──

  async createRecurringBill(userId: string, dto: CreateRecurringBillDto) {
    const [bill] = await this.db.insert(schema.recurringBills).values({
      id: randomUUID(),
      userId,
      name: dto.name,
      amount: dto.amount,
      dueDay: dto.dueDay,
      category: dto.category,
      status: dto.status ?? 'unpaid',
      reminderEnabled: dto.reminderEnabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
    return bill;
  }

  async findAllRecurringBills(userId: string) {
    return this.db.query.recurringBills.findMany({
      where: (b, { eq, and, isNull }) => and(eq(b.userId, userId), isNull(b.deletedAt)),
      orderBy: (b, { asc }) => [asc(b.dueDay)],
    });
  }

  async updateRecurringBill(id: string, userId: string, dto: UpdateRecurringBillDto) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.dueDay !== undefined) updateData.dueDay = dto.dueDay;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.reminderEnabled !== undefined) updateData.reminderEnabled = dto.reminderEnabled;
    const [bill] = await this.db.update(schema.recurringBills)
      .set(updateData)
      .where(and(eq(schema.recurringBills.id, id), eq(schema.recurringBills.userId, userId)))
      .returning();
    if (!bill) throw new NotFoundException('Recurring bill not found');
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
    return bill;
  }

  async deleteRecurringBill(id: string, userId: string) {
    const result = await this.db.update(schema.recurringBills)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(and(eq(schema.recurringBills.id, id), eq(schema.recurringBills.userId, userId)))
      .returning();
    if (!result.length) throw new NotFoundException('Recurring bill not found');
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
  }

  // ── Budgets ──

  async createBudget(userId: string, dto: CreateBudgetDto) {
    const [budget] = await this.db.insert(schema.budgets).values({
      id: randomUUID(),
      userId,
      category: dto.category,
      period: dto.period,
      amountLimit: dto.amountLimit,
      periodStart: dto.periodStart,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
    return budget;
  }

  async findAllBudgets(userId: string) {
    return this.db.query.budgets.findMany({
      where: (b, { eq }) => eq(b.userId, userId),
      orderBy: (b, { asc }) => [asc(b.category)],
    });
  }

  async updateBudget(id: string, userId: string, dto: UpdateBudgetDto) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.period !== undefined) updateData.period = dto.period;
    if (dto.amountLimit !== undefined) updateData.amountLimit = dto.amountLimit;
    if (dto.periodStart !== undefined) updateData.periodStart = dto.periodStart;
    const [budget] = await this.db.update(schema.budgets)
      .set(updateData)
      .where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)))
      .returning();
    if (!budget) throw new NotFoundException('Budget not found');
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
    return budget;
  }

  async deleteBudget(id: string, userId: string) {
    const result = await this.db.delete(schema.budgets)
      .where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)))
      .returning();
    if (!result.length) throw new NotFoundException('Budget not found');
    await this.statisticsService.invalidate(userId, 'money');
    await this.statisticsService.invalidate(userId, 'overall');
  }

  // ── Summary ──

  async getSummary(userId: string) {
    const accounts = await this.findAllAccounts(userId);
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    const today = new Date().toISOString().split('T')[0];
    const allTxns = await this.db.query.transactions.findMany({
      where: (t, { eq, and, isNull }) => and(eq(t.userId, userId), isNull(t.deletedAt)),
      orderBy: [desc(schema.transactions.date)],
      limit: 100,
    });

    const totalIncome = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = allTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      accounts,
      recentTransactions: allTxns.slice(0, 10),
    };
  }

  // ── Achievement evaluation helpers ──

  private async evaluateBudgetAchievement(userId: string): Promise<void> {
    const budgets = await this.findAllBudgets(userId);
    if (budgets.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    let allKept = true;

    for (const budget of budgets) {
      const start = budget.periodStart;
      const spent = await this.getSpendingInRange(userId, budget.category, start, today);
      if (spent > budget.amountLimit) {
        allKept = false;
        break;
      }
    }

    if (allKept) {
      this.achievementsGateway.onBudgetKept(userId, 1).catch(() => {});
    }
  }

  private async getSpendingInRange(userId: string, category: string, start: string, end: string): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'expense'),
          eq(schema.transactions.category, category),
          gte(schema.transactions.date, start),
          lte(schema.transactions.date, end),
        ),
      );
    return Number(row?.total ?? 0);
  }
}

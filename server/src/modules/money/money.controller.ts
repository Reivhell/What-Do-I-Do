import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
} from '@nestjs/common';
import { MoneyService } from './money.service.js'
import {
  CreateAccountDto, UpdateAccountDto,
  CreateTransactionDto, UpdateTransactionDto,
  CreateRecurringBillDto, UpdateRecurringBillDto,
  CreateBudgetDto, UpdateBudgetDto,
} from './dto/money.dto.js'

const DEFAULT_USER_ID = 'default';

@Controller('money')
export class MoneyController {
  constructor(private readonly moneyService: MoneyService) {}

  // ── Summary ──

  @Get('summary')
  async getSummary(@Query('userId') userId?: string) {
    return this.moneyService.getSummary(userId || DEFAULT_USER_ID);
  }

  // ── Accounts ──

  @Get('accounts')
  async findAllAccounts(@Query('userId') userId?: string) {
    return this.moneyService.findAllAccounts(userId || DEFAULT_USER_ID);
  }

  @Post('accounts')
  async createAccount(
    @Body() dto: CreateAccountDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.createAccount(userId || DEFAULT_USER_ID, dto);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.updateAccount(id, userId || DEFAULT_USER_ID, dto);
  }

  @Delete('accounts/:id')
  async deleteAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.deleteAccount(id, userId || DEFAULT_USER_ID);
  }

  // ── Transactions ──

  @Get('transactions')
  async findAllTransactions(
    @Query('userId') userId?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.moneyService.findAllTransactions(userId || DEFAULT_USER_ID, accountId);
  }

  @Post('transactions')
  async createTransaction(
    @Body() dto: CreateTransactionDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.createTransaction(userId || DEFAULT_USER_ID, dto);
  }

  @Patch('transactions/:id')
  async updateTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.updateTransaction(id, userId || DEFAULT_USER_ID, dto);
  }

  @Delete('transactions/:id')
  async deleteTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.deleteTransaction(id, userId || DEFAULT_USER_ID);
  }

  // ── Recurring Bills ──

  @Get('bills')
  async findAllBills(@Query('userId') userId?: string) {
    return this.moneyService.findAllRecurringBills(userId || DEFAULT_USER_ID);
  }

  @Post('bills')
  async createBill(
    @Body() dto: CreateRecurringBillDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.createRecurringBill(userId || DEFAULT_USER_ID, dto);
  }

  @Patch('bills/:id')
  async updateBill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringBillDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.updateRecurringBill(id, userId || DEFAULT_USER_ID, dto);
  }

  @Delete('bills/:id')
  async deleteBill(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.deleteRecurringBill(id, userId || DEFAULT_USER_ID);
  }

  // ── Budgets ──

  @Get('budgets')
  async findAllBudgets(@Query('userId') userId?: string) {
    return this.moneyService.findAllBudgets(userId || DEFAULT_USER_ID);
  }

  @Post('budgets')
  async createBudget(
    @Body() dto: CreateBudgetDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.createBudget(userId || DEFAULT_USER_ID, dto);
  }

  @Patch('budgets/:id')
  async updateBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.updateBudget(id, userId || DEFAULT_USER_ID, dto);
  }

  @Delete('budgets/:id')
  async deleteBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.moneyService.deleteBudget(id, userId || DEFAULT_USER_ID);
  }
}

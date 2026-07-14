import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max, IsBoolean, IsUUID } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['cash', 'bank', 'e_wallet'])
  type!: 'cash' | 'bank' | 'e_wallet';

  @IsOptional()
  @IsNumber()
  currentBalance?: number;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(['cash', 'bank', 'e_wallet'])
  type?: 'cash' | 'bank' | 'e_wallet';

  @IsOptional()
  @IsNumber()
  currentBalance?: number;
}

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @IsEnum(['income', 'expense', 'transfer'])
  type!: 'income' | 'expense' | 'transfer';

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  transferToAccountId?: string;

  @IsOptional()
  @IsUUID()
  linkedRecurringBillId?: string;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsEnum(['income', 'expense', 'transfer'])
  type?: 'income' | 'expense' | 'transfer';

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  transferToAccountId?: string;
}

export class CreateRecurringBillDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsEnum(['paid', 'unpaid'])
  status?: 'paid' | 'unpaid';

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}

export class UpdateRecurringBillDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['paid', 'unpaid'])
  status?: 'paid' | 'unpaid';

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  period!: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsNumber()
  @Min(0.01)
  amountLimit!: number;

  @IsString()
  @IsNotEmpty()
  periodStart!: string;
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amountLimit?: number;

  @IsOptional()
  @IsString()
  periodStart?: string;
}

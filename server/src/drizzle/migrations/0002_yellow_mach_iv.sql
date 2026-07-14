CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_user` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`period` text NOT NULL,
	`amount_limit` real NOT NULL,
	`period_start` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_budgets_user` ON `budgets` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_budgets_unique` ON `budgets` (`user_id`,`category`,`period`,`period_start`);--> statement-breakpoint
CREATE TABLE `recurring_bills` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`due_day` integer NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`reminder_enabled` integer DEFAULT true NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_recurring_bills_user` ON `recurring_bills` (`user_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`transfer_to_account_id` text,
	`linked_recurring_bill_id` text,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`transfer_to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`linked_recurring_bill_id`) REFERENCES `recurring_bills`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_user_date` ON `transactions` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_transactions_user_category_date` ON `transactions` (`user_id`,`category`,`date`);--> statement-breakpoint
CREATE INDEX `idx_transactions_account` ON `transactions` (`account_id`);
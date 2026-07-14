CREATE TABLE `analytics_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`period_type` text NOT NULL,
	`period_start` text NOT NULL,
	`discipline_score` real,
	`focus_score` real,
	`consistency_score` real,
	`time_distribution` text DEFAULT '{}' NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_analytics_snapshots_user_period` ON `analytics_snapshots` (`user_id`,`period_type`,`period_start`);--> statement-breakpoint
CREATE TABLE `statistics_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scope` text NOT NULL,
	`computed_at` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_statistics_cache_scope` ON `statistics_cache` (`user_id`,`scope`);--> statement-breakpoint
CREATE INDEX `idx_capture_items_user_status` ON `capture_items` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_capture_items_user_created_at` ON `capture_items` (`user_id`,`created_at`);
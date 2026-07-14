CREATE TABLE `achievement_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`requirement_type` text NOT NULL,
	`requirement_value` real NOT NULL,
	`icon` text NOT NULL,
	`category` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`unlocked_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_achievement_unique` ON `user_achievements` (`user_id`,`achievement_id`);--> statement-breakpoint
CREATE INDEX `idx_user_achievements_user` ON `user_achievements` (`user_id`);
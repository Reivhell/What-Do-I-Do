CREATE TABLE `activity_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`activity_name` text NOT NULL,
	`category` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`duration_minutes` integer,
	`source` text DEFAULT 'live' NOT NULL,
	`note` text,
	`source_event_id` text,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `capture_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`raw_text` text NOT NULL,
	`captured_at` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`detected_date` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'unprocessed' NOT NULL,
	`converted_to_type` text,
	`converted_to_id` text,
	`pinned` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`planner_reminder_enabled` integer DEFAULT true NOT NULL,
	`habit_reminder_enabled` integer DEFAULT true NOT NULL,
	`budget_alert_enabled` integer DEFAULT true NOT NULL,
	`goal_reminder_enabled` integer DEFAULT true NOT NULL,
	`achievement_alert_enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `planner_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`category` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`notes` text,
	`repeat_rule` text,
	`reminder_time` text,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`source_id` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`realized_session_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subtasks` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`title` text NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'inbox' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`due_date` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`linked_goal_id` text,
	`scheduled_event_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`language` text DEFAULT 'id' NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`timezone` text DEFAULT 'Asia/Makassar' NOT NULL,
	`date_format` text DEFAULT 'DD/MM/YYYY' NOT NULL,
	`time_format` text DEFAULT '24h' NOT NULL,
	`category_time_mapping` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar_url` text,
	`bio` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
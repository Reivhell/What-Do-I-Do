CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`target_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`progress_percent` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`title` text NOT NULL,
	`target_date` text,
	`is_completed` integer DEFAULT false NOT NULL,
	`generated_event_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generated_event_id`) REFERENCES `planner_events`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`linked_event_id` text,
	`linked_session_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`linked_event_id`) REFERENCES `planner_events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`linked_session_id`) REFERENCES `activity_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_habit_logs_habit_date` ON `habit_logs` (`habit_id`,`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`target_frequency` text DEFAULT 'daily' NOT NULL,
	`repeat_rule` text NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`best_streak` integer DEFAULT 0 NOT NULL,
	`completion_count` integer DEFAULT 0 NOT NULL,
	`missed_count` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`linked_goal_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`linked_goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE set null
);

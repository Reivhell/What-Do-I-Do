CREATE TABLE `pin_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`pin_hash` text,
	`enabled` integer DEFAULT false NOT NULL,
	`auto_lock_minutes` integer DEFAULT 5 NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`linked_goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`scheduled_event_id`) REFERENCES `planner_events`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "user_id", "title", "description", "status", "priority", "due_date", "tags", "notes", "linked_goal_id", "scheduled_event_id", "created_at", "updated_at") SELECT "id", "user_id", "title", "description", "status", "priority", "due_date", "tags", "notes", "linked_goal_id", "scheduled_event_id", "created_at", "updated_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_tasks_user_created_at` ON `tasks` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tasks_user_status_due_date` ON `tasks` (`user_id`,`status`,`due_date`);
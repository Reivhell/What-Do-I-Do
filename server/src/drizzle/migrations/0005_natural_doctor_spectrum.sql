CREATE INDEX `idx_tasks_user_created_at` ON `tasks` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tasks_user_status_due_date` ON `tasks` (`user_id`,`status`,`due_date`);
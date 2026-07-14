CREATE TABLE `life_log_annotations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_life_log_annotations_user_ts` ON `life_log_annotations` (`user_id`,`timestamp`);
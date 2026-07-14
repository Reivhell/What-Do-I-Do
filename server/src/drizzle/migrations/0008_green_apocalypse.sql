CREATE TABLE `insights` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`source_metric` text,
	`generated_at` text NOT NULL,
	`dismissed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_metric`) REFERENCES `analytics_snapshots`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_insights_user_active` ON `insights` (`user_id`,`dismissed`,`generated_at`);
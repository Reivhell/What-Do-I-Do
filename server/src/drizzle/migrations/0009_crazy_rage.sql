CREATE TABLE `layout_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`widget_config` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_layout_presets_user_created_at` ON `layout_presets` (`user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_layout_presets_one_active` ON `layout_presets` (`user_id`) WHERE `is_active` = 1;
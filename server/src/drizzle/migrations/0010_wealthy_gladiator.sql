DROP INDEX `idx_layout_presets_one_active`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_layout_presets_one_active` ON `layout_presets` (`user_id`) WHERE "layout_presets"."is_active" = 1;
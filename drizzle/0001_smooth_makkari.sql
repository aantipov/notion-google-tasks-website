ALTER TABLE users ADD `setup_completion_prompt_sent` integer;--> statement-breakpoint
ALTER TABLE users ADD `setup_completion_prompt_sent_date` integer;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `is_n_connected`;
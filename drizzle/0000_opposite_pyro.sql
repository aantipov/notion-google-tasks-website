CREATE TABLE `sync_stats` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`deleted` integer NOT NULL,
	`total` integer NOT NULL,
	`system` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`email` text PRIMARY KEY NOT NULL,
	`g_token` text NOT NULL,
	`n_token` text,
	`tasklist_id` text,
	`database_id` text,
	`mapping` text,
	`last_synced` integer,
	`setup_completion_prompt_sent` integer,
	`setup_completion_prompt_sent_date` integer,
	`sync_error` text,
	`created` integer NOT NULL,
	`modified` integer NOT NULL
);

CREATE TABLE `users` (
	`email` text PRIMARY KEY NOT NULL,
	`g_token` text NOT NULL,
	`n_token` text,
	`is_n_connected` integer DEFAULT false NOT NULL,
	`tasklist_id` text,
	`database_id` text,
	`mapping` text,
	`last_synced` integer,
	`created` integer NOT NULL,
	`modified` integer NOT NULL
);

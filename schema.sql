DROP TABLE IF EXISTS users;

CREATE TABLE
	IF NOT EXISTS users (
		`email` text PRIMARY KEY NOT NULL,
		`g_token` text NOT NULL,
		`n_token` text,
		`tasklist_id` text,
		`database_id` text,
		`mapping` text,
		`last_synced` integer,
		`created` integer NOT NULL,
		`modified` integer NOT NULL
	)

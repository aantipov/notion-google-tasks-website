import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type * as googleApi from '@/functions-helpers/google-api';
import type * as notionApi from '@/functions-helpers/notion-api';

type GTokenT =
	ReturnType<typeof googleApi.fetchToken> extends Promise<infer T> ? T : never;
type GTokenRestrictedT = Pick<GTokenT, 'user' | 'refresh_token'>;
type NTokenT =
	ReturnType<typeof notionApi.fetchToken> extends Promise<infer T> ? T : never;
type GTaskIdT = string;
type NTaskIdT = string;
type CompletedAtT = string | null; // ISO date string '2023-10-25'

export const users = sqliteTable('users', {
	email: text('email').primaryKey(),
	gToken: text('g_token', { mode: 'json' })
		.$type<GTokenRestrictedT>()
		.notNull(),
	nToken: text('n_token', { mode: 'json' }).$type<NTokenT>(),
	tasklistId: text('tasklist_id'),
	databaseId: text('database_id'),
	mapping: text('mapping', { mode: 'json' }).$type<
		[GTaskIdT, NTaskIdT, CompletedAtT?][]
	>(),
	lastSynced: integer('last_synced', { mode: 'timestamp' }), // Important to recognize that sync was established successfully
	setupCompletionPromptSent: integer('setup_completion_prompt_sent', {
		mode: 'boolean',
	}),
	setupCompletionPromptSentDate: integer('setup_completion_prompt_sent_date', {
		mode: 'timestamp',
	}),
	syncError: text('sync_error', { mode: 'json' }).$type<{
		message: string;
		num: number; // Number of consecutive sync errors
		nextRetry: number | null; // Timestamp in ms. Null if no retries left. Max 10 retries within 5 days
		sentEmail: boolean;
	}>(), // Last sync error message. Reset to null on successful sync
	created: integer('created', { mode: 'timestamp' }).notNull(),
	modified: integer('modified', { mode: 'timestamp' }).notNull(),
});

export type UserRawT = typeof users.$inferInsert;
export type UserT = Omit<UserRawT, 'gToken' | 'nToken' | 'mapping'> & {
	nConnected: boolean;
};

export const syncStats = sqliteTable('sync_stats', {
	id: integer('id').primaryKey(),
	email: text('email').notNull(),
	created: integer('created', { mode: 'number' }).notNull(),
	updated: integer('updated', { mode: 'number' }).notNull(),
	deleted: integer('deleted', { mode: 'number' }).notNull(),
	total: integer('total', { mode: 'number' }).notNull(),
	system: text('system', { enum: ['google', 'notion'] }).notNull(),
	created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});

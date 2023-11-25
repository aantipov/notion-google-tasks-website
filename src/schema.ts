import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type * as googleApi from '@/functions-helpers/google-api';
import type * as notionApi from '@/functions-helpers/notion-api';

type GTokenT = ReturnType<typeof googleApi.fetchToken> extends Promise<infer T>
	? T
	: never;
type NTokenT = ReturnType<typeof notionApi.fetchToken> extends Promise<infer T>
	? T
	: never;

type gTaskId = string;
type nTaskId = string;
type completedAt = string | null; // ISO date string '2023-10-25'

export const users = sqliteTable('users', {
	email: text('email').primaryKey(),
	gToken: text('g_token', { mode: 'json' }).$type<GTokenT>().notNull(),
	nToken: text('n_token', { mode: 'json' }).$type<NTokenT>(),
	tasklistId: text('tasklist_id'),
	databaseId: text('database_id'),
	mapping: text('mapping', { mode: 'json' }).$type<
		[gTaskId, nTaskId, completedAt?][]
	>(),
	lastSynced: integer('last_synced', { mode: 'timestamp' }), // Important to recognize that sync was established successfully
	created: integer('created', { mode: 'timestamp' }).notNull(),
	modified: integer('modified', { mode: 'timestamp' }).notNull(),
});

export type UserRawT = typeof users.$inferInsert;
export type UserT = Omit<UserRawT, 'gToken' | 'nToken' | 'mapping'> & {
	nConnected: boolean;
};

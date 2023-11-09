import type * as googleApi from '@/functions-helpers/google-api';
import type * as notionApi from '@/functions-helpers/notion-api';

type gTaskId = string;
type nTaskId = string;
type completedAt = string; // ISO date string '2023-10-25'

export interface KVDataT {
	gToken: ReturnType<typeof googleApi.fetchToken> extends Promise<infer T>
		? T
		: never;
	nToken: ReturnType<typeof notionApi.fetchToken> extends Promise<infer T>
		? T
		: never;
	gTasksListId: string;
	nDatabaseId: string;
	mapping: [gTaskId, nTaskId, completedAt?][]; // completedAt is used to remove mapping after a certain time since the task was completed in Google
	lastSynced: string; // ISO date string '2023-10-25T11:56:22.678Z'
	created: string; // ISO date string '2023-10-25T11:56:22.678Z'
}

export type KVDataPartialT = Pick<KVDataT, 'gToken'>;

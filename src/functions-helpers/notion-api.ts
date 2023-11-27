/**
 * Notion API helpers
 * IMPORTANT: This file is to be used by Server Functions only!
 */
import { Buffer } from 'node:buffer';
import { Client } from '@notionhq/client';
import type { GTaskT } from '@/helpers/api';
import { NOTION_RATE_LIMIT } from '@/constants';
import { z, type ZodIssue } from 'zod';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

type PromiseValueType<T> = T extends Promise<infer R> ? R : T;
export type DBSchemaT = PromiseValueType<
	ReturnType<typeof fetchDatabaseSchema>
>;

// Notion Tasks statuses
const DONE = 'Done' as const;
const TODO = 'To Do' as const;
type StatusT = typeof DONE | typeof TODO;

export type SchemaValidationResponseT =
	| { success: true }
	| { success: false; issues: ZodIssue[] };

const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

export interface NTaskT {
	id: string;
	title: string;
	status: StatusT;
	due: null | { start: string };
	lastEdited: string; // ISO date string '2023-10-25T11:56:00.000Z'
	lastEditedByBot: boolean; // true if last edited by bot (Google Tasks Sync Bot)
}

export interface NTokenResponseT {
	access_token: string;
	bot_id: string;
	duplicated_template_id: string | null;
	owner: any;
	workspace_icon: string | null;
	workspace_id: string;
	workspace_name: string | null;
}
interface NDatabaseT {
	id: string;
	title: string;
}
export interface NDatabasesResponseT {
	items: NDatabaseT[];
}

export async function fetchDatabaseSchema(databaseId: string, token: string) {
	const notion = new Client({ auth: token });
	const response = await notion.databases.retrieve({ database_id: databaseId });
	return response;
}

export interface NPropsMapT {
	title: { id: string; name: string; type: 'title' };
	status: { id: string; name: string; type: 'status' };
	due: { id: string; name: string; type: 'date' };
	lastEdited: { id: string; name: string; type: 'last_edited_time' };
	lastEditedBy: { id: string; name: string; type: 'last_edited_by' };
}

export type DBSchemaFieldT =
	| 'title'
	| 'status'
	| 'due'
	| 'lastEdited'
	| 'lastEditedBy';

export const DbPropsSchema = z.object({
	title: z.object({
		id: z.string(),
		name: z.string(),
		type: z.literal('title'),
	}),
	status: z.object({
		id: z.string(),
		name: z.string(),
		type: z.literal('status'), // TODO: ensure Status prop has proper values
		status: z.object({
			options: z
				.array(
					z.object({
						id: z.string(),
						name: z.string(),
						color: z.string(),
					}),
				)
				.refine((arr) => arr.some((opt) => opt.name === DONE), {
					message: 'status_done_or_todo',
				})
				.refine((arr) => arr.some((opt) => opt.name === TODO), {
					message: 'status_done_or_todo',
				}),
		}),
	}),
	due: z.object({
		id: z.string(),
		name: z.string(),
		type: z.literal('date'),
	}),
	lastEdited: z.object({
		id: z.string(),
		name: z.string(),
		type: z.literal('last_edited_time'),
	}),
	lastEditedBy: z.object({
		id: z.string(),
		name: z.string(),
		type: z.literal('last_edited_by'),
	}),
});

export function validateDbBSchema(
	dbSchema: DBSchemaT,
): SchemaValidationResponseT {
	const props = Object.values(dbSchema.properties);

	const nPropsMap = {
		title: props.find((p) => p.type === 'title'),
		status: props.find((p) => p.type === 'status'),
		due: props.find((p) => p.type === 'date'),
		lastEdited: props.find((p) => p.type === 'last_edited_time'),
		lastEditedBy: props.find((p) => p.type === 'last_edited_by'),
	} as NPropsMapT;

	const parseRes = DbPropsSchema.safeParse(nPropsMap);

	return parseRes.success
		? { success: true }
		: { success: false, issues: parseRes.error.issues };
}

/**
 * Fetch open tasks for initial sync
 */
export async function fetchOpenTasks(
	databaseId: string,
	propsMap: NPropsMapT,
	token: string,
) {
	const notion = new Client({ auth: token });
	const filterProps = Object.values(propsMap).map(
		(prop: { id: any }) => prop.id,
	);
	const response = await notion.databases.query({
		database_id: databaseId,
		archived: true,
		filter_properties: filterProps,
		page_size: 100,
		filter: {
			property: propsMap.status.name,
			status: { equals: TODO },
		},
		sorts: [
			{
				property: propsMap.lastEdited.id,
				direction: 'descending',
			},
		],
	});

	type DBPropT = PageObjectResponse['properties'][string];
	type ExtractPropType<T, U> = T extends { type: U } ? T : never;
	type TitlePropT = ExtractPropType<DBPropT, 'title'>;
	type StatusPropT = ExtractPropType<DBPropT, 'status'>;
	type DuePropT = ExtractPropType<DBPropT, 'date'>;
	type LastEditedPropT = ExtractPropType<DBPropT, 'last_edited_time'>;
	type LastEditedByPropT = ExtractPropType<DBPropT, 'last_edited_by'>;

	const tasks: NTaskT[] = (response.results as PageObjectResponse[]).map(
		(result) => ({
			id: result.id,
			title: (result.properties[propsMap.title.name] as TitlePropT).title // @ts-ignore
				.map((title) => title.plain_text)
				.join(''),
			status: (result.properties[propsMap.status.name] as StatusPropT).status!
				.name as StatusT,
			due: (result.properties[propsMap.due.name] as DuePropT).date,
			lastEdited: (
				result.properties[propsMap.lastEdited.name] as LastEditedPropT
			).last_edited_time,
			lastEditedBy: (
				result.properties[propsMap.lastEditedBy.name] as LastEditedByPropT
			).last_edited_by.id,
			lastEditedByBot:
				// @ts-ignore
				result.properties[propsMap.lastEditedBy.name].last_edited_by.type ===
				'bot',
		}),
	);

	return { databaseId, items: tasks };
}

type GTaskIdT = string;
type NTaskIdT = string;
type IdTupleT = [GTaskIdT, NTaskIdT];

export async function createAllTasks(
	gTasks: GTaskT[],
	databaseId: string,
	propsMap: NPropsMapT,
	acdessToken: string,
): Promise<IdTupleT[]> {
	const promises = [];
	for (let i = 0; i < gTasks.length; i++) {
		const promise: Promise<IdTupleT> = new Promise((resolveTask) => {
			setTimeout(
				async () => {
					const gTask = gTasks[i];
					const nTask = await createTask(
						gTask,
						databaseId,
						propsMap,
						acdessToken,
					);
					resolveTask([gTask.id, nTask.id]);
				},
				Math.floor(i / NOTION_RATE_LIMIT) * 1000,
			);
		});
		promises.push(promise);
	}
	return Promise.all(promises);
}

async function createTask(
	gTask: GTaskT,
	databaseId: string,
	propsMap: NPropsMapT,
	accessToken: string,
) {
	console.log('Creating Notion task', gTask.title);
	try {
		const notion = new Client({ auth: accessToken });
		const date = gTask.due ? { start: gTask.due.slice(0, 10) } : null;
		const properties = {
			[propsMap.title.name]: { title: [{ text: { content: gTask.title } }] },
			[propsMap.due.name]: { date },
			[propsMap.status.name]: {
				status: { name: gTask.status === 'completed' ? DONE : TODO },
			},
		};
		const response = await notion.pages.create({
			parent: { database_id: databaseId },
			properties,
		});
		return response;
	} catch (error) {
		console.error('Error creating Notion task', error);
		throw error;
	}
}

export async function fetchDatabases(
	token: string,
): Promise<NDatabasesResponseT> {
	try {
		const notion = new Client({ auth: token });

		const response = await notion.search({
			query: '',
			filter: {
				value: 'database',
				property: 'object',
			},
			sort: {
				direction: 'ascending',
				timestamp: 'last_edited_time',
			},
		});

		const items = response.results.map((result) => {
			return {
				id: result.id,
				// @ts-ignore
				title: result.title.map((t) => t.text.content).join(''),
			};
		});

		return { items };
	} catch (error) {
		console.error('Error fetching databases', error);
		throw error;
	}
}

export async function fetchToken(authCode: string, env: CFEnvT) {
	try {
		// encode in base 64
		const encoded = Buffer.from(
			`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`,
		).toString('base64');

		const tokensResp = await fetch(TOKEN_URL, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Basic ${encoded}`,
			},
			body: JSON.stringify({
				code: authCode,
				redirect_uri: env.NOTION_REDIRECT_URI,
				grant_type: 'authorization_code',
			}),
		});

		if (!tokensResp.ok) {
			throw new Error(
				`Failed to fetch token data: ${tokensResp.status} ${tokensResp.statusText}`,
			);
		}

		// TODO: handle error response with { error } = await tokensResp.json(); Possible values: https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
		const tokenData = (await tokensResp.json()) as NTokenResponseT;
		return tokenData;
	} catch (error) {
		console.error('Error fetching token data', error);
		throw error;
	}
}

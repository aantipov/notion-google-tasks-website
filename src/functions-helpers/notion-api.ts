/**
 * Notion API helpers
 * IMPORTANT: This file is to be used by Server Functions only!
 */
import { Buffer } from 'node:buffer';
import { Client } from '@notionhq/client';
import type { GTaskT } from '@/helpers/api';
import { NOTION_RATE_LIMIT } from '@/constants';

const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

export interface NTaskT {
	id: string;
	title: string;
	status: 'To Do' | 'Done';
	due: null | {
		start: string;
	};
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
			status: {
				equals: 'To Do',
			},
		},
		sorts: [
			{
				property: propsMap.lastEdited.id,
				direction: 'descending',
			},
		],
	});
	// response.results.forEach((result) => {
	// 	// @ts-ignore
	// 	// if (result.properties.Due.date) {
	// 	// @ts-ignore
	// 	console.log('result.properties', JSON.stringify(result.properties, null, 2));
	// 	// }
	// });

	const tasks = response.results.map((result) => ({
		id: result.id,
		// @ts-ignore
		title: result.properties[propsMap.title.name].title
			// @ts-ignore
			.map((title) => title.plain_text)
			.join(''),
		// @ts-ignore
		status: result.properties[propsMap.status.name].status.name,
		// @ts-ignore
		due: result.properties.Due.date,
		// @ts-ignore
		lastEdited: result.properties[propsMap.lastEdited.name].last_edited_time,
		// @ts-ignore
		lastEditedBy:
			// @ts-ignore
			result.properties[propsMap.lastEditedBy.name].last_edited_by.id,
		// @ts-ignore
		lastEditedByBot:
			// @ts-ignore
			result.properties[propsMap.lastEditedBy.name].last_edited_by.type ===
			'bot',
	}));

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
				status: { name: gTask.status === 'completed' ? 'Done' : 'To Do' },
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

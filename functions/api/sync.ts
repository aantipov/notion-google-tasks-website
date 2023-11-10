import * as notionApi from '@/functions-helpers/notion-api';
import * as googleApi from '@/functions-helpers/google-api';
import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import type { KVDataPartialT, KVDataT } from '@/types';
import type { GTaskT } from './google-tasks';

interface NPropsMapT {
	title: { id: string; name: string; type: 'title' };
	status: { id: string; name: string; type: 'status' };
	due: { id: string; name: string; type: 'date' };
	lastEdited: { id: string; name: string; type: 'last_edited_time' };
	lastEditedBy: { id: string; name: string; type: 'last_edited_by' };
}

/**
 * Get user notion's dabaseses list
 */
export const onRequestPost: PagesFunction<CFEnvT> = async ({
	env,
	request,
}) => {
	const { gToken } = await getTokensFromCookie(request, env);

	if (!gToken) {
		return new Response('Invalid token', { status: 401 });
	}

	const kvData = (await env.NOTION_GTASKS_KV.get<KVDataPartialT>(
		gToken.user.email,
		{ type: 'json' },
	)) as KVDataT;

	if (!kvData.databaseId || !kvData.nToken) {
		return new Response('Notion is not connected or database is not selected', {
			status: 400,
		});
	}
	const nDBSchema = await notionApi.fetchDatabaseSchema(
		kvData.databaseId,
		kvData.nToken.access_token,
	);
	// console.log('ndbScheme', JSON.stringify(ndbScheme, null, 2));

	// TODO: ensure the user's selected database has all the required properties
	// TODO: ensure Status prop has proper values
	const nPropsMap = {
		title: Object.values(nDBSchema.properties).find((p) => p.type === 'title'),
		status: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'status',
		),
		due: Object.values(nDBSchema.properties).find((p) => p.type === 'date'),
		lastEdited: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'last_edited_time',
		),
		lastEditedBy: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'last_edited_by',
		),
	} as NPropsMapT;

	const { items: nTasks } = await notionApi.fetchOpenTasks(
		kvData.databaseId,
		nPropsMap,
		kvData.nToken.access_token,
	);
	const { items: gTasks } = await googleApi.fetchOpenTasks(
		kvData.tasksListId,
		gToken.access_token,
	);

	console.log('nTasks', JSON.stringify(nTasks, null, 2));
	console.log('gTasks', JSON.stringify(gTasks, null, 2));

	const nIdTuples = await notionApi.createAllTasks(
		gTasks,
		kvData.databaseId,
		nPropsMap,
		kvData.nToken.access_token,
	);
	console.log('nIdTuples', JSON.stringify(nIdTuples, null, 2));
	// const gIdTuples = await createAllGoogleTasks(
	// 	nTasks,
	// 	gTasksListId,
	// 	gAccessToken,
	// );

	return new Response(JSON.stringify({ hello: 'hello' }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

async function getTokensFromCookie(req: Request, env: CFEnvT) {
	const { gJWTToken, nJWTToken } = parseRequestCookies(req);
	return await decodeJWTTokens(gJWTToken, nJWTToken, env.JWT_SECRET);
}

import * as notionApi from '@/functions-helpers/notion-api';
import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import type { KVDataPartialT, KVDataT } from '@/types';
import { DELETE_GTOKEN_COOKIE, DELETE_NTOKEN_COOKIE } from '@/constants';

interface BodyT {
	id: string;
}
/**
 * Get user notion's dabaseses list
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const { gToken } = await getTokensFromCookie(request, env);

	if (!gToken) {
		return new Response('Invalid token', {
			status: 401,
			headers: [
				['Set-Cookie', DELETE_GTOKEN_COOKIE],
				['Set-Cookie', DELETE_NTOKEN_COOKIE],
			],
		});
	}

	let kvData = await env.NOTION_GTASKS_KV.get<KVDataT>(gToken.user.email, {
		type: 'json',
	});

	if (!kvData || !kvData.nToken) {
		return new Response('Notion is not connected', { status: 400 });
	}

	const databases = await notionApi.fetchDatabases(kvData.nToken.access_token);

	return new Response(JSON.stringify(databases), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

/**
 * Store user-selected database id in KV
 */
export const onRequestPost: PagesFunction<CFEnvT> = async ({
	env,
	request,
	params,
}) => {
	const { gToken } = await getTokensFromCookie(request, env);
	const requestBody = (await request.json()) as BodyT;
	const databaseId = requestBody.id;

	if (!gToken) {
		return new Response('Invalid token', {
			status: 401,
			headers: [
				['Set-Cookie', DELETE_GTOKEN_COOKIE],
				['Set-Cookie', DELETE_NTOKEN_COOKIE],
			],
		});
	}

	if (!databaseId) {
		return new Response('Invalid request', { status: 400 });
	}

	const email = gToken.user.email;

	const kvData = (await env.NOTION_GTASKS_KV.get<KVDataPartialT>(email, {
		type: 'json',
	})) as KVDataT;

	const kvDataUpdated = {
		...kvData,
		databaseId,
		modified: new Date().toISOString(),
	} as KVDataT;

	// TODO: do not log tokens
	console.log('Updating KV with database id', kvDataUpdated);

	await env.NOTION_GTASKS_KV.put(email, JSON.stringify(kvDataUpdated));

	return new Response(JSON.stringify({ message: 'OK' }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

async function getTokensFromCookie(req: Request, env: CFEnvT) {
	const { gJWTToken, nJWTToken } = parseRequestCookies(req);
	return await decodeJWTTokens(gJWTToken, nJWTToken, env.JWT_SECRET);
}

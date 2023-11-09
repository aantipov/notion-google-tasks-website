import * as notionApi from '@/functions-helpers/notion-api';
import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import jwt from '@tsndr/cloudflare-worker-jwt';
import type { KVDataPartialT } from '@/types';

interface BodyT {
	id: string;
}
/**
 * Get user notion's dabaseses list
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const { gToken, nToken } = await getTokensFromCookie(request, env);

	if (!gToken || !nToken) {
		return new Response('Invalid token', { status: 401 });
	}

	const databases = await notionApi.fetchDatabases(nToken.access_token);

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
	const { nToken, gToken } = await getTokensFromCookie(request, env);
	const requestBody = (await request.json()) as BodyT;
	const databaseId = requestBody.id;

	if (!databaseId) {
		return new Response('Invalid request', { status: 400 });
	}
	if (!nToken || !gToken) {
		return new Response('Invalid token', { status: 401 });
	}

	const email = gToken.user.email;

	const kvData = await env.NOTION_GTASKS_KV.get<KVDataPartialT>(email, {
		type: 'json',
	});

	const kvDataUpdated = { ...kvData, databaseId };

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

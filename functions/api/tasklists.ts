import * as googleApi from '@/functions-helpers/google-api';
import jwt from '@tsndr/cloudflare-worker-jwt';
import type { KVDataPartialT } from '@/types';

interface BodyT {
	id: string;
}
const TASKS_LISTS_URL =
	'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100';

/**
 * Get user's tasklists from Google Tasks
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const gAccessToken = await getGAccessTokenFromCookie(request, env);
	if (!gAccessToken) {
		return new Response('Invalid token', { status: 401 });
	}

	const resp = await fetch(TASKS_LISTS_URL, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${gAccessToken.access_token}`,
			accept: 'application/json',
		},
	});

	if (!resp.ok) {
		if (resp.status === 401) {
			const newResponse = new Response(resp.body, resp);
			newResponse.headers.set(
				'Set-Cookie',
				'gtoken=; HttpOnly; Secure; Path=/;',
			);
			return newResponse;
		}
	}

	return resp;
};

/**
 * Store user-selected Google tasklist id in KV
 */
export const onRequestPost: PagesFunction<CFEnvT> = async ({
	env,
	request,
	params,
}) => {
	const gAccessToken = await getGAccessTokenFromCookie(request, env);
	const requestBody = (await request.json()) as BodyT;
	const tasklistId = requestBody.id;

	if (!tasklistId) {
		return new Response('Invalid request', { status: 400 });
	}
	if (!gAccessToken) {
		return new Response('Invalid token', { status: 401 });
	}

	const email = gAccessToken.user.email;

	const kvData = await env.NOTION_GTASKS_KV.get<KVDataPartialT>(email, {
		type: 'json',
	});

	const kvDataUpdated = { ...kvData, gTasksListId: tasklistId };

	console.log('Updating KV with tasklist id', kvDataUpdated);

	await env.NOTION_GTASKS_KV.put(email, JSON.stringify(kvDataUpdated));

	return new Response(JSON.stringify({ message: 'OK' }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

async function getGAccessTokenFromCookie(req: Request, env: CFEnvT) {
	const cookieHeader = req.headers.get('Cookie') || '';
	const cookies = cookieHeader.split('; ').reduce(
		(acc, cookie) => {
			const [name, value] = cookie.split('=');
			acc[name] = value;
			return acc;
		},
		{} as { [key: string]: string },
	);

	const jwtToken = cookies['gtoken'];

	if (!jwtToken) {
		return null;
	}

	const isTokenValid = await jwt.verify(jwtToken, env.JWT_SECRET);
	if (!isTokenValid) {
		return null;
	}
	const token = await jwt.decode(jwtToken);

	return token.payload as googleApi.GTokenResponseT;
}

import * as googleApi from '@/functions-helpers/google-api';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { DELETE_GTOKEN_COOKIE, DELETE_NTOKEN_COOKIE } from '@/constants';

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

			// delete gtoken cookie
			newResponse.headers.set('Set-Cookie', DELETE_GTOKEN_COOKIE);
			newResponse.headers.set('Set-Cookie', DELETE_NTOKEN_COOKIE);

			return newResponse;
		}
	}

	return resp;
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

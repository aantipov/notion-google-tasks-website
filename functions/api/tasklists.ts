import type { AuthDataT } from '@/functions-helpers/auth-data';
import { DELETE_GTOKEN_COOKIE } from '@/constants';

const TASKS_LISTS_URL =
	'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100';

/**
 * Get user's tasklists from Google Tasks
 */
export const onRequestGet: PagesFunction<CFEnvT, any, AuthDataT> = async ({
	data,
}) => {
	const resp = await fetch(TASKS_LISTS_URL, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${data.gToken.access_token}`,
			accept: 'application/json',
		},
	});

	if (!resp.ok) {
		if (resp.status === 401) {
			const newResponse = new Response(resp.body, resp);

			newResponse.headers.set('Set-Cookie', DELETE_GTOKEN_COOKIE);

			return newResponse;
		}
	}

	return resp;
};

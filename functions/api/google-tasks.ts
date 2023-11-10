import * as googleApi from '@/functions-helpers/google-api';
import jwt from '@tsndr/cloudflare-worker-jwt';
import type { KVDataPartialT, KVDataT } from '@/types';
import { GOOGLE_MAX_TASKS } from '@/constants';

interface BodyT {
	id: string;
}

// https://developers.google.com/tasks/reference/rest/v1/tasks#resource:-task
export interface GTaskT {
	id: string;
	title: string; // can be an empty string
	status: 'needsAction' | 'completed';
	due?: string; // ISO Date string 2023-10-31T00:00:00.000Z time portion is always 00:00:00. We can't get or set time.
	notes?: string; // == Description
	updated: string; // ISO date string '2023-10-25T11:56:22.678Z'
	parent?: string; // omitted if task is a top-level task
	completed?: string; // Complettion date of the task
	deleted?: boolean;
	hidden?: boolean;
}

export interface GTasksResponseT {
	nextPageToken: string;
	items: GTaskT[];
}

/**
 * Get user's tasklists from Google Tasks
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const gToken = await decodeGTokenFromCookie(request, env);
	if (!gToken) {
		return new Response('Invalid token', { status: 401 });
	}

	try {
		const kvData = (await env.NOTION_GTASKS_KV.get<KVDataPartialT>(
			gToken.user.email,
			{
				type: 'json',
			},
		)) as KVDataT;

		if (!kvData.tasksListId) {
			return new Response('No tasklist selected', { status: 400 });
		}

		const tasksAPIUrl = new URL(
			`https://tasks.googleapis.com/tasks/v1/lists/${kvData.tasksListId}/tasks`,
		);
		tasksAPIUrl.searchParams.set('maxResults', GOOGLE_MAX_TASKS.toString());

		const resp = await fetch(tasksAPIUrl.toString(), {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${gToken.access_token}`,
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
			throw new Error(
				`Failed to fetch Google tasks: ${resp.status} ${resp.statusText}`,
			);
		}

		return resp;
	} catch (error) {
		console.error('Error fetching google tasks', error);
		return new Response('Error fetching google tasks', { status: 500 });
	}
};

async function decodeGTokenFromCookie(req: Request, env: CFEnvT) {
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

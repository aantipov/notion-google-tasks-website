import * as googleApi from '@/functions-helpers/google-api';
import { ServerError } from '@/functions-helpers/server-error';
import { DELETE_GTOKEN_COOKIE } from '@/constants';
import { users, type UserRawT } from '@/schema';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { AuthDataT } from '@/functions-helpers/auth-data';

/**
 * Get user's tasklists from Google Tasks
 */
export const onRequestGet: PagesFunction<CFEnvT, any, AuthDataT> = async ({
	env,
	data,
}) => {
	const userEmail = data.gToken.user.email.toLowerCase();
	const db = drizzle(env.DB, { logger: true });
	let userData: UserRawT;

	try {
		[userData] = await db
			.select()
			.from(users)
			.where(eq(users.email, userEmail))
			.limit(1);

		if (!userData?.tasklistId) {
			return new Response('No tasklist selected', { status: 400 });
		}

		const res = await googleApi.fetchOpenTasks(
			userData.tasklistId,
			data.gToken.access_token,
		);

		return Response.json(res);
	} catch (error) {
		// @ts-ignore
		if (error?.code === 401) {
			return new Response('Invalid token', {
				status: 401,
				headers: [['Set-Cookie', DELETE_GTOKEN_COOKIE]],
			});
		}
		throw new ServerError('Failed to fetch google tasks', error);
	}
};

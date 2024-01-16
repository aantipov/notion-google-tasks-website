import * as googleApi from '@/functions-helpers/google-api';
import { ServerError } from '@/functions-helpers/server-error';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { DELETE_GTOKEN_COOKIE, DELETE_NTOKEN_COOKIE } from '@/constants';
import { users, type UserRawT } from '@/schema';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';

/**
 * Get user's tasklists from Google Tasks
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const gToken = await decodeGTokenFromCookie(request, env);
	if (!gToken) {
		return new Response('Invalid token', {
			status: 401,
			headers: [['Set-Cookie', DELETE_GTOKEN_COOKIE]],
		});
	}

	const userEmail = gToken.user.email.toLowerCase();
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
			gToken.access_token,
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

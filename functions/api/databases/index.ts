import * as notionApi from '@/functions-helpers/notion-api';
import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import { DELETE_GTOKEN_COOKIE } from '@/constants';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT } from '@/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user Notion's databases list
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const { gToken } = await getTokensFromCookie(request, env);

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
	} catch (error) {
		return new Response('Error fetching user data', { status: 500 });
	}

	if (!userData?.nToken) {
		return new Response('Notion is not connected', { status: 400 });
	}

	const databases = await notionApi.fetchDatabases(
		userData.nToken.access_token,
	);

	return new Response(JSON.stringify(databases), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

async function getTokensFromCookie(req: Request, env: CFEnvT) {
	const { gJWTToken, nJWTToken } = parseRequestCookies(req);
	return await decodeJWTTokens(gJWTToken, nJWTToken, env.JWT_SECRET);
}

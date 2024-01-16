import * as notionApi from '@/functions-helpers/notion-api';
import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { ServerError } from '@/functions-helpers/server-error';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import { DELETE_GTOKEN_COOKIE } from '@/constants';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT } from '@/schema';
import { eq } from 'drizzle-orm';

/**
 * Validate selected Notion database' schema
 * This function should be invoked at /api/databases/validate/:dbid
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({
	env,
	request,
	params,
}) => {
	if (!params.dbid || typeof params.dbid !== 'string') {
		return new Response('Missing database ID', { status: 400 });
	}
	const { dbid } = params;
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
		throw new ServerError('Failed to fetch user data', error);
	}

	if (!userData?.nToken) {
		return new Response('Notion is not connected', { status: 400 });
	}

	let nDBSchema: notionApi.DBSchemaT;
	try {
		nDBSchema = await notionApi.fetchDatabaseSchema(
			dbid,
			userData.nToken.access_token,
		);
	} catch (error) {
		throw new ServerError('Failed to fetch database schema', error);
	}

	return Response.json(notionApi.validateDbBSchema(nDBSchema));
};

async function getTokensFromCookie(req: Request, env: CFEnvT) {
	const { gJWTToken, nJWTToken } = parseRequestCookies(req);
	return await decodeJWTTokens(gJWTToken, nJWTToken, env.JWT_SECRET);
}

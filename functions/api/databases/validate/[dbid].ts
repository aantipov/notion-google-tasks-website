import * as notionApi from '@/functions-helpers/notion-api';
import { ServerError } from '@/functions-helpers/server-error';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT } from '@/schema';
import { eq } from 'drizzle-orm';
import type { AuthDataT } from '@/functions-helpers/auth-data';

/**
 * Validate selected Notion database' schema
 * This function should be invoked at /api/databases/validate/:dbid
 */
export const onRequestGet: PagesFunction<CFEnvT, any, AuthDataT> = async ({
	env,
	params,
	data,
}) => {
	if (!params.dbid || typeof params.dbid !== 'string') {
		return new Response('Missing database ID', { status: 400 });
	}
	const { dbid } = params;

	const userEmail = data.gToken.user.email.toLowerCase();
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

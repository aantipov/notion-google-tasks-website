import * as notionApi from '@/functions-helpers/notion-api';
import { ServerError } from '@/functions-helpers/server-error';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT } from '@/schema';
import { eq } from 'drizzle-orm';
import type { AuthDataT } from '@/functions-helpers/auth-data';

/**
 * Get user Notion's databases list
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
	} catch (error) {
		throw new ServerError('Failed to fetch user data', error);
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

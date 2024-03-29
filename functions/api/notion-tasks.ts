import * as notionApi from '@/functions-helpers/notion-api';
import { ServerError } from '@/functions-helpers/server-error';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT } from '@/schema';
import type { AuthDataT } from '@/functions-helpers/auth-data';

export interface NPropsMapT {
	title: { id: string; name: string; type: 'title' };
	status: { id: string; name: string; type: 'status' };
	due: { id: string; name: string; type: 'date' };
	lastEdited: { id: string; name: string; type: 'last_edited_time' };
	lastEditedBy: { id: string; name: string; type: 'last_edited_by' };
}

/**
 * Get user notion's dabaseses list
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
		if (!userData) {
			throw new Error('User not found');
		}
	} catch (error) {
		throw new ServerError('Failed to fetch user data', error);
	}

	const { nToken, databaseId } = userData;

	if (!databaseId || !nToken) {
		return new Response('Notion is not connected or database is not selected', {
			status: 400,
		});
	}
	const nDBSchema = await notionApi.fetchDatabaseSchema(
		databaseId,
		nToken.access_token,
	);

	// TODO: ensure the user's selected database has all the required properties
	// TODO: ensure Status prop has proper values
	const nPropsMap = {
		title: Object.values(nDBSchema.properties).find((p) => p.type === 'title'),
		status: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'status',
		),
		due: Object.values(nDBSchema.properties).find((p) => p.type === 'date'),
		lastEdited: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'last_edited_time',
		),
		lastEditedBy: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'last_edited_by',
		),
	} as NPropsMapT;

	const tasks = await notionApi.fetchOpenTasks(
		databaseId,
		nPropsMap,
		nToken.access_token,
	);

	return Response.json(tasks);
};

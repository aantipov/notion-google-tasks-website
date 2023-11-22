import * as notionApi from '@/functions-helpers/notion-api';
import * as googleApi from '@/functions-helpers/google-api';
import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import { DELETE_GTOKEN_COOKIE } from '@/constants';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT, type UserT } from '@/schema';
import { eq } from 'drizzle-orm';

interface NPropsMapT {
	title: { id: string; name: string; type: 'title' };
	status: { id: string; name: string; type: 'status' };
	due: { id: string; name: string; type: 'date' };
	lastEdited: { id: string; name: string; type: 'last_edited_time' };
	lastEditedBy: { id: string; name: string; type: 'last_edited_by' };
}

/**
 * Get user notion's dabaseses list
 */
export const onRequestPost: PagesFunction<CFEnvT> = async ({
	env,
	request,
}) => {
	const { gToken } = await getTokensFromCookie(request, env);

	if (!gToken) {
		return new Response('Invalid token', {
			status: 401,
			headers: [['Set-Cookie', DELETE_GTOKEN_COOKIE]],
		});
	}

	const email = gToken.user.email;
	const db = drizzle(env.DB, { logger: true });
	let userData: UserRawT;
	try {
		[userData] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
	} catch (error) {
		return new Response('Error fetching user data', { status: 500 });
	}

	const { nToken, databaseId, tasklistId } = userData;

	if (!databaseId || !nToken || !tasklistId) {
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

	const { items: nTasks } = await notionApi.fetchOpenTasks(
		databaseId,
		nPropsMap,
		nToken.access_token,
	);
	const { items: gTasks } = await googleApi.fetchOpenTasks(
		tasklistId,
		gToken.access_token,
	);

	const nIdTuples = await notionApi.createAllTasks(
		gTasks,
		databaseId,
		nPropsMap,
		nToken.access_token,
	);

	const gIdTuples = await googleApi.createAllGoogleTasks(
		nTasks,
		tasklistId,
		gToken.access_token,
	);

	let updUserData: UserRawT;

	try {
		[updUserData] = await db
			.update(users)
			.set({
				mapping: [...nIdTuples, ...gIdTuples],
				lastSynced: new Date(),
				modified: new Date(),
			})
			.where(eq(users.email, email))
			.returning();
	} catch (error) {
		return new Response('Error updating user data', { status: 500 });
	}

	return new Response(JSON.stringify(getSafeUserData(updUserData)), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

async function getTokensFromCookie(req: Request, env: CFEnvT) {
	const { gJWTToken, nJWTToken } = parseRequestCookies(req);
	return await decodeJWTTokens(gJWTToken, nJWTToken, env.JWT_SECRET);
}

function getSafeUserData(user: UserRawT): UserT {
	const { gToken: _, nToken: __, mapping: ___, ...safeUserData } = user;
	return { ...safeUserData, nConnected: !!user.nToken };
}

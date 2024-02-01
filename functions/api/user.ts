import { ServerError } from '@/functions-helpers/server-error';
import { DELETE_GTOKEN_COOKIE, GOOGLE_SCOPES_ARRAY } from '@/constants';
import * as googleApi from '@/functions-helpers/google-api';
import type { AuthDataT } from '@/functions-helpers/auth-data';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT, type UserT } from '@/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user data from DB if it's there
 * Otherwise create a new user and return it
 * The returned user data is safe to be sent to the client (no sensitive data)
 */
export const onRequestGet: PagesFunction<CFEnvT, any, AuthDataT> = async ({
	env,
	data,
}) => {
	const { gToken } = data;

	if (!validateScopes(gToken.scope.split(' '))) {
		return new Response('Invalid token scopes', { status: 403 });
	}

	// Check gToken is still valid/active
	try {
		await googleApi.fetchUserInfo(gToken.access_token);
	} catch (error) {
		// @ts-ignore
		if (error?.code === 401) {
			return new Response('Invalid token', {
				status: 401,
				headers: [['Set-Cookie', DELETE_GTOKEN_COOKIE]],
			});
		} else {
			throw new ServerError('Failed to fetch user info', error);
		}
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

	// Create a new user if not exists in DB
	if (!userData) {
		const gTokenWithNoAccessToken = {
			user: gToken.user,
			refresh_token: gToken.refresh_token,
		};
		try {
			let newUser: UserRawT = {
				email: userEmail,
				gToken: gTokenWithNoAccessToken as googleApi.GTokenResponseT,
				created: new Date(),
				modified: new Date(),
			};
			// Reassign the newsly created user to userData
			[userData] = await db.insert(users).values(newUser).returning();
		} catch (error) {
			throw new ServerError('Failed to create new user', error);
		}
	}

	const headers = new Headers();
	headers.append('Content-Type', 'application/json');

	return new Response(JSON.stringify(getSafeUserData(userData)), {
		status: 200,
		headers,
	});
};

/**
 * Store user-selected Google tasklist id in DB
 */
export const onRequestPost: PagesFunction<CFEnvT, any, AuthDataT> = async ({
	env,
	request,
	data,
}) => {
	const { tasklistId, databaseId } = (await request.json()) as {
		tasklistId?: string;
		databaseId?: string;
	};

	if (!tasklistId && !databaseId) {
		return new Response('Invalid request', { status: 400 });
	}

	const email = data.gToken.user.email;
	const db = drizzle(env.DB, { logger: true });
	let userData: UserRawT;

	try {
		[userData] = await db
			.update(users)
			.set({
				...(!!tasklistId && { tasklistId }),
				...(!!databaseId && { databaseId }),
				modified: new Date(),
			})
			.where(eq(users.email, email))
			.returning();
	} catch (error) {
		throw new ServerError('Failed to update user data', error);
	}

	return Response.json(getSafeUserData(userData));
};

export const onRequestDelete: PagesFunction<CFEnvT, any, AuthDataT> = async ({
	env,
	request,
	data,
}) => {
	const { email } = (await request.json()) as { email: string };

	if (!email) {
		return new Response('Invalid request', { status: 400 });
	}

	const tokenEmail = data.gToken.user.email;
	if (email !== tokenEmail) {
		return new Response('Invalid request', { status: 400 });
	}

	const db = drizzle(env.DB, { logger: true });

	try {
		const res = await db.delete(users).where(eq(users.email, email));
		if (!res.success) {
			throw new Error(res.error);
		}
	} catch (error) {
		throw new ServerError('Failed to update user data', error);
	}

	return new Response('User deleted', {
		status: 200,
		headers: [['Set-Cookie', DELETE_GTOKEN_COOKIE]],
	});
};

function validateScopes(userScopes: string[]): boolean {
	const requiredScopes = GOOGLE_SCOPES_ARRAY;
	return requiredScopes.every((scope) => userScopes.includes(scope));
}

function getSafeUserData(user: UserRawT): UserT {
	const { gToken: _, nToken: __, mapping: ___, ...safeUserData } = user;
	return { ...safeUserData, nConnected: !!user.nToken };
}

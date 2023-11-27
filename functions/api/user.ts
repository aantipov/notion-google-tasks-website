import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import {
	DELETE_GTOKEN_COOKIE,
	DELETE_NTOKEN_COOKIE,
	GOOGLE_SCOPES_ARRAY,
} from '@/constants';
import * as googleApi from '@/functions-helpers/google-api';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT, type UserT } from '@/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user data from DB if it's there & set nToken if it's not set yet
 * Otherwise create a new user and return it
 * Delete nToken cookie if it's set
 * The returned user data is safe to be sent to the client (no sensitive data)
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const { gToken, nToken } = await getTokensFromCookie(request, env);

	if (!gToken) {
		return new Response('Invalid token', {
			status: 401,
			headers: [
				['Set-Cookie', DELETE_GTOKEN_COOKIE],
				['Set-Cookie', DELETE_NTOKEN_COOKIE],
			],
		});
	}

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
				headers: [
					['Set-Cookie', DELETE_GTOKEN_COOKIE],
					['Set-Cookie', DELETE_NTOKEN_COOKIE],
				],
			});
		} else {
			return new Response('Error fetching user info', { status: 500 });
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
		return new Response('Error fetching user data', { status: 500 });
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
			if (nToken) {
				newUser.nToken = nToken;
			}
			// Reassign the newsly created user to userData
			[userData] = await db.insert(users).values(newUser).returning();
		} catch (error) {
			return new Response('Error creating new user', { status: 500 });
		}
	}

	// Set nToken if it's not set yet
	if (!userData.nToken && nToken) {
		try {
			console.log('Updating DB with nToken');
			[userData] = await db
				.update(users)
				.set({
					nToken,
					modified: new Date(),
				})
				.where(eq(users.email, userEmail))
				.returning();
		} catch (error) {
			return new Response('Error updating user data', { status: 500 });
		}
	}

	const headers = new Headers();
	headers.append('Content-Type', 'application/json');
	// We should delete the nToken cookie if it exists, because we store it in DB and gToken should be a single source of truth
	if (nToken) {
		headers.append('Set-Cookie', DELETE_NTOKEN_COOKIE);
	}

	return new Response(JSON.stringify(getSafeUserData(userData)), {
		status: 200,
		headers,
	});
};

/**
 * Store user-selected Google tasklist id in DB
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

	const { tasklistId, databaseId } = (await request.json()) as {
		tasklistId?: string;
		databaseId?: string;
	};

	if (!tasklistId && !databaseId) {
		return new Response('Invalid request', { status: 400 });
	}

	const email = gToken.user.email;
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
		return new Response('Error updating user data', { status: 500 });
	}

	return Response.json(getSafeUserData(userData));
};

async function getTokensFromCookie(req: Request, env: CFEnvT) {
	const { gJWTToken, nJWTToken } = parseRequestCookies(req);
	return await decodeJWTTokens(gJWTToken, nJWTToken, env.JWT_SECRET);
}

function validateScopes(userScopes: string[]): boolean {
	const requiredScopes = GOOGLE_SCOPES_ARRAY;
	return requiredScopes.every((scope) => userScopes.includes(scope));
}

function getSafeUserData(user: UserRawT): UserT {
	const { gToken: _, nToken: __, mapping: ___, ...safeUserData } = user;
	return { ...safeUserData, nConnected: !!user.nToken };
}

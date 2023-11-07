/**
 * Google OAuth2 callback endpoint
 * Google redirects user to this endpoint after they provide consent
 */

import jwt from '@tsndr/cloudflare-worker-jwt';
import * as googleApi from '@helpers/google-api';

export const prerender = false;

interface TokenResponseT {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: 'Bearer';
}

interface UserInfoResponseT {
	id: string;
	email: string;
	verified_email: boolean;
	picture: string;
}

interface JWTTokenPayloadT {
	accessToken: string;
	email: string;
	verifiedEmail: boolean;
}

type gTaskId = string;
type nTaskId = string;
type completedAt = string; // ISO date string '2023-10-25'

interface UserKVDataT {
	gToken: TokenResponseT;
	gUser: UserInfoResponseT;
	gTasksListId?: string;
	nDatabaseId?: string;
	mapping?: [gTaskId, nTaskId, completedAt?][];
	lastSynced?: string; // ISO date string '2023-10-25T11:56:22.678Z'
}

interface UserKVDataInitializedT {
	gToken: TokenResponseT;
	gUser: UserInfoResponseT;
	gTasksListId: string;
	nDatabaseId: string;
	mapping: [gTaskId, nTaskId, completedAt?][]; // completedAt is used to remove mapping after a certain time since the task was completed in Google
	lastSynced: string; // ISO date string '2023-10-25T11:56:22.678Z'
}

export const onRequestGet: PagesFunction<CFEnvT> = async ({ request, env }) => {
	const url = new URL(request.url);
	const authCode = url.searchParams.get('code');
	const authError = url.searchParams.get('error');

	if (authError) {
		// TODO: handle user not provided consent
		return new Response(`Error: ${authError}`, { status: 400 });
	}

	if (!authCode) {
		return new Response('Invalid request. Please try again.', {
			status: 400,
		});
	}

	// Exchange auth code for access token
	const tokenData = await googleApi.fetchToken(authCode, env);

	// Get user info
	const userData = await googleApi.fetchUserInfo(tokenData.access_token);
	if (!userData.verified_email) {
		return new Response('User email not verified', { status: 400 });
	}

	// Store user and token in KV
	await env.NOTION_GTASKS_KV.put(
		userData.email,
		JSON.stringify({
			gToken: tokenData,
			gUser: userData,
		} as UserKVDataT),
	);

	// Create JWT token for stateless auth and set in cookie
	// TODO: set expiration time?
	const jwtToken = await jwt.sign(
		{
			accessToken: tokenData.access_token,
			email: userData.email,
			verifiedEmail: userData.verified_email,
		} as JWTTokenPayloadT,
		env.JWT_SECRET,
	);

	return new Response(null, {
		status: 302,
		statusText: 'Found',
		headers: {
			Location: '/',
			'Set-Cookie': `token=${jwtToken}; HttpOnly; Secure; Path=/;`,
		},
	});
};

/**
 * Google OAuth2 callback endpoint
 * Google redirects user to this endpoint after they provide consent
 */

import { GOOGLE_TOKEN_URI, GOOGLE_USERINFO_URL } from '@/constants';
import jwt from '@tsndr/cloudflare-worker-jwt';

export const prerender = false;

export interface TokenResponseT {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: 'Bearer';
}

export interface UserInfoResponseT {
	id: string;
	email: string;
	verified_email: boolean;
	picture: string;
}

export interface JWTTokenPayloadT {
	email: string;
	verified_email: boolean;
}

type gTaskId = string;
type nTaskId = string;
type completedAt = string; // ISO date string '2023-10-25'

export interface UserKVDataT {
	gToken: TokenResponseT;
	gUser: UserInfoResponseT;
	gTasksListId?: string;
	nDatabaseId?: string;
	mapping?: [gTaskId, nTaskId, completedAt?][];
	lastSynced?: string; // ISO date string '2023-10-25T11:56:22.678Z'
}

export interface UserKVDataInitializedT {
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
	const googleTokenUrl = new URL(GOOGLE_TOKEN_URI);
	googleTokenUrl.searchParams.set('code', authCode);
	googleTokenUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
	googleTokenUrl.searchParams.set('client_secret', env.GOOGLE_CLIENT_SECRET);
	googleTokenUrl.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
	googleTokenUrl.searchParams.set('grant_type', 'authorization_code');
	const tokensResp = await fetch(googleTokenUrl.toString(), {
		method: 'POST',
		headers: { accept: 'application/json' },
	});
	// TODO: handle error response
	const tokenData = (await tokensResp.json()) as TokenResponseT;
	const accessToken = tokenData.access_token;

	// Get user info
	const userInfoResp = await fetch(GOOGLE_USERINFO_URL, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			accept: 'application/json',
		},
	});
	const userInfoData = (await userInfoResp.json()) as UserInfoResponseT;
	if (!userInfoData.verified_email) {
		return new Response('User email not verified', { status: 400 });
	}

	// Store user and token in KV
	await env.NOTION_GTASKS_KV.put(
		userInfoData.email,
		JSON.stringify({
			gToken: tokenData,
			gUser: userInfoData,
		} as UserKVDataT),
	);

	// Create JWT token for stateless auth and set in cookie
	// TODO: set expiration time?
	const jwtToken = await jwt.sign(
		{
			email: userInfoData.email,
			verified_email: userInfoData.verified_email,
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

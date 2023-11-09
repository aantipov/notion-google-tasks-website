/**
 * Google API helpers
 * IMPORTANT: This file is to be used by Server Functions only!
 */

import { GOOGLE_TOKEN_URI, GOOGLE_USERINFO_URL } from '@/constants';

interface UserInfoResponseT {
	id: string;
	email: string;
	verified_email: boolean;
	picture: string;
}

interface OritinalTokenResponseT {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: 'Bearer';
}

export interface GTokenResponseT extends OritinalTokenResponseT {
	user: UserInfoResponseT;
}

export interface GTasksListT {
	id: string;
	title: string;
}

async function fetchUserInfo(accessToken: string): Promise<UserInfoResponseT> {
	try {
		const userResp = await fetch(GOOGLE_USERINFO_URL, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				accept: 'application/json',
			},
		});
		if (!userResp.ok) {
			throw new Error(
				`Failed to fetch user info: ${userResp.status} ${userResp.statusText}`,
			);
		}
		const userData = (await userResp.json()) as UserInfoResponseT;
		return userData;
	} catch (error) {
		console.error('Error fetching user info', error);
		throw error;
	}
}

export async function fetchToken(
	authCode: string,
	env: CFEnvT,
): Promise<GTokenResponseT> {
	try {
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
		if (!tokensResp.ok) {
			throw new Error(
				`Failed to fetch token data: ${tokensResp.status} ${tokensResp.statusText}`,
			);
		}
		// TODO: handle error response
		const tokenData = (await tokensResp.json()) as OritinalTokenResponseT;
		const userData = await fetchUserInfo(tokenData.access_token);

		if (!userData.verified_email) {
			throw new Error('User email not verified');
		}

		return { ...tokenData, user: userData };
	} catch (error) {
		console.error('Error fetching token data', error);
		throw error;
	}
}

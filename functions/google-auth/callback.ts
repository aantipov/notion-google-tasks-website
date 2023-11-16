/**
 * Google OAuth2 callback endpoint
 * Google redirects user to this endpoint after they provide consent
 */

import jwt from '@tsndr/cloudflare-worker-jwt';
import * as googleApi from '@/functions-helpers/google-api';

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

	// Create JWT token for stateless auth and set in cookie
	// TODO: set expiration time?
	const jwtToken = await jwt.sign(tokenData, env.JWT_SECRET);

	return new Response(null, {
		status: 302,
		statusText: 'Found',
		headers: {
			Location: '/#start-sync',
			// set cookie with expiration in 1 hour
			'Set-Cookie': `gtoken=${jwtToken}; HttpOnly; Secure; Path=/; Max-Age=3600;`,
		},
	});
};

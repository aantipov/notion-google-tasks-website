/**
 * Google OAuth2 callback endpoint
 * Google redirects user to this endpoint after they provide consent
 */

import jwt from '@tsndr/cloudflare-worker-jwt';
import type { PluginData } from '@cloudflare/pages-plugin-sentry';
import * as googleApi from '@/functions-helpers/google-api';

export const onRequestGet: PagesFunction<CFEnvT, any, PluginData> = async ({
	request,
	env,
	data,
}) => {
	const url = new URL(request.url);
	const authCode = url.searchParams.get('code');
	const authError = url.searchParams.get('error');

	// Possible Error values: https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
	if (authError) {
		data.sentry.captureException(new Error('google-auth-cb: ' + authError));
		if (authError === 'access_denied') {
			return new Response(null, {
				status: 302,
				statusText: 'Found',
				headers: {
					Location: '/',
					'Set-Cookie': `auth-error=gaccess_denied; Path=/; Max-Age=20;`,
				},
			});
		}

		return new Response(null, {
			status: 302,
			statusText: 'Found',
			headers: {
				Location: '/',
				'Set-Cookie': `auth-error=gaccess_error; Path=/; Max-Age=20;`,
			},
		});
	}

	if (!authCode) {
		data.sentry.captureException(
			new Error('google-auth-cb: missing auth code'),
		);

		return new Response(null, {
			status: 302,
			statusText: 'Found',
			headers: {
				Location: '/',
				'Set-Cookie': `auth-error=gaccess_error; Path=/; Max-Age=20;`,
			},
		});
	}

	let jwtToken;
	try {
		// Exchange auth code for access token
		const tokenData = await googleApi.fetchToken(authCode, env);

		data.sentry.addBreadcrumb({
			message: 'Google token fetched successfully',
			level: 'info',
		});

		// Create JWT token for stateless auth and set in cookie
		// TODO: set expiration time?
		jwtToken = await jwt.sign(tokenData, env.JWT_SECRET);
	} catch (error) {
		data.sentry.captureException(error);
		return new Response(null, {
			status: 302,
			statusText: 'Found',
			headers: {
				Location: '/',
				'Set-Cookie': `auth-error=gaccess_error; Path=/; Max-Age=20;`,
			},
		});
	}

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

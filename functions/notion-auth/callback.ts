/**
 * Google OAuth2 callback endpoint
 * Google redirects user to this endpoint after they provide consent
 */

import jwt from '@tsndr/cloudflare-worker-jwt';
import type { PluginData } from '@cloudflare/pages-plugin-sentry';
import * as notionApi from '@/functions-helpers/notion-api';

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
		data.sentry.captureException(new Error('Notion Auth Error: ' + authError));
		if (authError === 'access_denied') {
			return Response.redirect(url.origin + '/?error=naccess_denied', 302);
		}
		return Response.redirect(url.origin + '/?error=naccess_error', 302);
	}

	if (!authCode) {
		data.sentry.captureException(new Error('Invalid request'));
		return new Response('Invalid request. Please try again.', {
			status: 400,
		});
	}

	// Exchange auth code for access token
	const tokenData = await notionApi.fetchToken(authCode, env);

	// Create JWT token for stateless auth and set in cookie
	// TODO: set expiration time?
	const jwtToken = await jwt.sign(tokenData, env.JWT_SECRET);

	return new Response(null, {
		status: 302,
		statusText: 'Found',
		headers: {
			Location: '/#start-sync',
			'Set-Cookie': `ntoken=${jwtToken}; HttpOnly; Secure; Path=/; Max-Age=3600;`,
		},
	});
};

/**
 * Google OAuth2 callback endpoint
 * Google redirects user to this endpoint after they provide consent
 */

import type { PluginData } from '@cloudflare/pages-plugin-sentry';
import type { AuthDataT } from '@/functions-helpers/auth-data';
import * as notionApi from '@/functions-helpers/notion-api';
import * as dbApi from '@/functions-helpers/db-api';

export const onRequestGet: PagesFunction<
	CFEnvT,
	any,
	PluginData & AuthDataT
> = async ({ request, env, data }) => {
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

	try {
		// Exchange auth code for access token
		const tokenData = await notionApi.fetchToken(authCode, env, data.sentry);

		data.sentry.addBreadcrumb({
			message: 'Notion token fetched successfully',
			level: 'info',
			// strip access_token from the data
			data: { ...tokenData, access_token: '***' },
		});

		await dbApi.storeNotionToken(data.gToken.user.email, tokenData, env);
	} catch (error) {
		data.sentry.captureException(error);
		return Response.redirect(url.origin + '/?error=naccess_error', 302);
	}

	return Response.redirect(url.origin + '/#start-sync', 302);
};

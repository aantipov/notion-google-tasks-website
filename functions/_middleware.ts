import sentryPlugin from '@cloudflare/pages-plugin-sentry';
import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import type { PluginData } from '@cloudflare/pages-plugin-sentry';
import { ServerError } from '@/functions-helpers/server-error';
import { DELETE_GTOKEN_COOKIE, DELETE_NTOKEN_COOKIE } from '@/constants';
// https://developers.cloudflare.com/pages/functions/plugins/sentry/
// https://github.com/cloudflare/pages-plugins/blob/main/packages/sentry/functions/_middleware.ts

const authentication: PagesFunction<CFEnvT, any, PluginData> = async ({
	request,
	env,
	next,
	data,
}) => {
	const authPaths = [
		'/api/user',
		'/api/tasklists',
		'/api/google-tasks',
		'/api/notion-tasks',
		'/api/sync',
		'/api/databases/validate',
		'/api/databases',
	];

	const url = new URL(request.url);

	if (!authPaths.some((path) => url.pathname.startsWith(path))) {
		return next();
	}

	const { gJWTToken, nJWTToken } = parseRequestCookies(request);
	const { gToken, nToken } = await decodeJWTTokens(
		gJWTToken,
		nJWTToken,
		env.JWT_SECRET,
	);

	if (!gToken) {
		data.sentry.captureException(new Error('Invalid token'));
		return new Response('Invalid token', {
			status: 401,
			headers: [
				['Set-Cookie', DELETE_GTOKEN_COOKIE],
				['Set-Cookie', DELETE_NTOKEN_COOKIE],
			],
		});
	}

	data.sentry.setUser({ email: gToken.user.email });
	// @ts-ignore
	data.gToken = gToken;
	// @ts-ignore
	data.nToken = nToken;

	return next();
};

export const onRequest: PagesFunction<CFEnvT, any, any>[] = [
	// Capture errors re-thrown by Sentry Plugin
	async (context) => {
		if (context.env.ENVIRONMENT === 'development') {
			return await context.next();
		}

		try {
			return await context.next();
		} catch (err: any) {
			const errMessage =
				err instanceof ServerError ? err?.message : 'Server Error';

			console.error(errMessage);
			return new Response(errMessage, { status: 500 });
		}
	},
	// Initialize a Sentry Plugin to capture any errors (it re-throws them)
	(context) => {
		return sentryPlugin({
			dsn: context.env.SENTRY_DSN,
			enabled: context.env.ENVIRONMENT !== 'development',
		})(context);
	},

	authentication,
];

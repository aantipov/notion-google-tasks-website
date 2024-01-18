import sentryPlugin from '@cloudflare/pages-plugin-sentry';
import { ServerError } from '@/functions-helpers/server-error';
// https://developers.cloudflare.com/pages/functions/plugins/sentry/
// https://github.com/cloudflare/pages-plugins/blob/main/packages/sentry/functions/_middleware.ts

export const onRequest: PagesFunction<CFEnvT>[] = [
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
		if (context.env.ENVIRONMENT === 'development') {
			return context.next();
		}

		return sentryPlugin({ dsn: context.env.SENTRY_DSN })(context);
	},

	// Populate the Sentry plugin with additional information about the current user
	// (context) => {
	// 	const email =
	// 		context.data.cloudflareAccessJWT.payload?.email || 'service user';

	// 	context.data.sentry.setUser({ email });

	// 	return next();
	// },
];

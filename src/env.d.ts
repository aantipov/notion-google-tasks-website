/// <reference types="astro/client" />
// There is a copy of this type in the /functions directory
type CFEnvT = {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_REDIRECT_URI: string;
	NOTION_CLIENT_ID: string;
	NOTION_CLIENT_SECRET: string;
	NOTION_REDIRECT_URI: string;
	JWT_SECRET: string;
	DB: D1Database;
	SENTRY_DSN: string;
	MAILJET_API_KEY: string;
	MAILJET_SECRET_KEY: string;
	MAILJET_TEMPLATE_ID: string;
	ENVIRONMENT: 'development' | 'production';
};

type Runtime = import('@astrojs/cloudflare').DirectoryRuntime<CFEnvT>;

declare namespace App {
	interface Locals extends Runtime {
		user: {
			name: string;
			surname: string;
		};
	}
}

/// <reference types="astro/client" />
type KVNamespace = import('@cloudflare/workers-types/experimental').KVNamespace;
// There is a copy of this type in the /functions directory
type CFEnvT = {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_REDIRECT_URI: string;
	NOTION_CLIENT_ID: string;
	NOTION_CLIENT_SECRET: string;
	NOTION_REDIRECT_URI: string;
	NOTION_TOKEN: string;
	NOTION_GTASKS_KV: KVNamespace;
	JWT_SECRET: string;
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

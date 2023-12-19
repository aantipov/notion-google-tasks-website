import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: 'https://notion-google-tasks-sync.com',
	output: 'hybrid',
	adapter: cloudflare({
		mode: 'directory',
		routes: {
			strategy: 'auto',
			include: ['/google-auth/*', '/notion-auth/*', '/api/*'],
		},
		functionPerRoute: false,
		runtime: { mode: 'local' },
	}),
	integrations: [tailwind(), react()],
	vite: {
		build: {
			minify: false,
		},
	},
});

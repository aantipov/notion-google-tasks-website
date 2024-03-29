import { defineConfig, passthroughImageService } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: 'https://notion-google-tasks-sync.com',
	output: 'static',
	image: {
		service: passthroughImageService(), // quality of images is bad with the default service
	},
	// adapter: cloudflare({
	// 	mode: 'directory',
	// 	routes: {
	// 		strategy: 'auto',
	// 		include: ['/google-auth/*', '/notion-auth/*', '/api/*'],
	// 	},
	// 	runtime: {
	// 		mode: 'local',
	// 		type: 'pages',
	// 		bindings: { DB: { type: 'd1' } },
	// 	},
	// }),
	integrations: [
		tailwind({
			applyBaseStyles: false, // is needed because of the shadcn/ui
		}),
		react(),
	],
	vite: {
		build: {
			minify: false,
			sourcemap: true,
		},
	},
});

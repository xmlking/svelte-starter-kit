import adapter from '@sveltejs/adapter-node';
// import preprocess from 'svelte-preprocess';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			polyfill: false
		}),

		// When hosting SPA on GitHub Pages
		// paths: {
		//   base: dev ? '' : '/svelte-starter-kit',
		// },

		// prerender: { entries: [] },
		alias: {
			$mocks: 'src/mocks',
			$houdini: './$houdini'
		}
	}
};

export default config;

import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ...mdsvexConfig.extensions],
	preprocess: [vitePreprocess({}), mdsvex(mdsvexConfig)],

	kit: {
		adapter: adapter({ strict: false }),
		prerender: {
			handleMissingId: 'warn'
		}
	}
};

export default config;

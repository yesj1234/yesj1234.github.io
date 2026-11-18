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
			handleMissingId: 'warn',
			// 페이지에서 링크되지 않는 파일도 빌드에 포함한다
			entries: ['*', '/sitemap.xml', '/rss.xml', '/llms.txt']
		}
	}
};

export default config;

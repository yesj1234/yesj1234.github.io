import { defineMDSveXConfig as defineConfig } from 'mdsvex';
import remarkFootnotes from 'remark-footnotes';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import toc from '@jsdevtools/rehype-toc';
const config = defineConfig({
	extensions: ['.svelte.md', '.md', '.svx'],

	smartypants: {
		dashes: 'oldschool'
	},

	remarkPlugins: [remarkFootnotes, [remarkToc, { heading: 'Table of Contents' }]],
	rehypePlugins: [rehypeSlug, toc]
});

export default config;

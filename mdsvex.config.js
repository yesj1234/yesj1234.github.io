import { defineMDSveXConfig as defineConfig } from 'mdsvex';
import remarkFootnotes from 'remark-footnotes';
import remarkToc from 'remark-toc';
const config = defineConfig({
	extensions: ['.svelte.md', '.md', '.svx'],

	smartypants: {
		dashes: 'oldschool'
	},

	remarkPlugins: [remarkFootnotes, [remarkToc, { heading: 'Table of Contents' }]],
	rehypePlugins: []
});

export default config;

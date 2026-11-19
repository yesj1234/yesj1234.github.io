import { defineMDSveXConfig as defineConfig, escapeSvelte } from 'mdsvex';
import remarkFootnotes from 'remark-footnotes';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import toc from '@jsdevtools/rehype-toc';
import { createHighlighter } from 'shiki';
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets';

// 글에서 실제로 쓰는 언어만 불러온다. 목록에 없는 언어는 색 없이 text 로 그린다
const LANGS = [
	'dart',
	'swift',
	'kotlin',
	'java',
	'python',
	'bash',
	'yaml',
	'json',
	'javascript',
	'typescript',
	'html',
	'css',
	'markdown',
	'ruby',
	'c',
	'xml',
	'diff'
];
const ALIASES = { sh: 'bash', shell: 'bash', zsh: 'bash', js: 'javascript', ts: 'typescript', yml: 'yaml', md: 'markdown', kt: 'kotlin', py: 'python' };
const LABELS = { bash: 'shell' };

const highlighter = await createHighlighter({ themes: ['light-plus', 'dark-plus'], langs: LANGS });

function resolveLang(raw) {
	const lang = String(raw ?? '').trim().toLowerCase();
	const resolved = ALIASES[lang] ?? lang;
	return LANGS.includes(resolved) ? resolved : 'text';
}

const config = defineConfig({
	extensions: ['.svelte.md', '.md', '.svx'],

	smartypants: {
		dashes: 'oldschool'
	},

	highlight: {
		// VS Code 와 같은 TextMate 문법·테마로 빌드 때 칠해 둔다(방문자 쪽 JS 없음).
		// 라이트·다크 색을 함께 넣고, 테마 전환은 app.pcss 의 --shiki-dark 변수로 한다
		highlighter: async (code, rawLang) => {
			const lang = resolveLang(rawLang);
			const html = highlighter.codeToHtml(code, {
				lang,
				themes: { light: 'light-plus', dark: 'dark-plus' },
				defaultColor: 'light',
				transformers: lang === 'text' ? [] : [transformerColorizedBrackets()]
			});
			const label = LABELS[lang] ?? lang;
			const block = `<div class="code-block"><div class="code-head"><span class="code-lang">${label}</span><button type="button" class="code-copy" aria-label="코드 복사">복사</button></div>${html}</div>`;
			return `{@html \`${escapeSvelte(block)}\` }`;
		}
	},

	remarkPlugins: [remarkFootnotes, [remarkToc, { heading: 'Table of Contents' }]],
	rehypePlugins: [rehypeSlug, toc]
});

export default config;

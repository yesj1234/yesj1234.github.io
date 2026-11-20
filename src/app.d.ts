// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	interface Window {
		goatcounter?: { count: (vars?: { path?: string; title?: string; referrer?: string }) => void };
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		interface MdsvexFile {
			default: import('$lib/components/Page.svelte');
			metadata: Record<string, string>;
		}
		type MdsvexResolver = () => Promise<MdsvexFile>;

		interface BlogPost {
			slug: string;
			title: string;
			description: string;
			date: string;
			published: string;
			tags: string;
			cover?: string;
			series?: string;
			seriesOrder?: number;
			category?: string;
			summary?: PostSummary;
		}

		/** 글 맨 위 「30초 요약」 박스. 링크로 들어온 면접관이 본문 전에 읽는다 */
		interface PostSummary {
			problem: string;
			role: string;
			result: string;
			stack: string;
		}

		interface SeriesEntry {
			slug: string;
			title: string;
			order: number;
		}

		interface SeriesInfo {
			id: string;
			title: string;
			posts: SeriesEntry[];
		}

		interface MdsvexTags {
			default: import('svelte/internal').SvelteComponent;
			metadata: Record<string, string | Array[string]>;
		}
		type MdsvexTagsResolver = () => Promise<MdsvexTags>;
		interface TagsPost {
			title: string;
			author: string;
			description: string;
			date: string;
			published: string;
			tags: Array[string];
		}
	}
}

export {};

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
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

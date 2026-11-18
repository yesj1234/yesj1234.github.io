import { slugFromPath } from '$lib/slugFromPath';
import { toIsoDate } from '$lib/utils/date_utils';

/** 공개된 글의 메타데이터를 최신순으로 돌려준다. sitemap·RSS·llms.txt 가 같이 쓴다 */
export async function loadPublishedPosts(): Promise<App.BlogPost[]> {
	const modules = import.meta.glob('/src/post_items/*.md');
	const posts = await Promise.all(
		Object.entries(modules).map(async ([path, resolver]) => {
			const { metadata } = (await resolver()) as App.MdsvexFile;
			return { slug: slugFromPath(path) ?? '', ...metadata } as unknown as App.BlogPost;
		})
	);
	return posts
		.filter((post) => post.published)
		.sort((a, b) => toIsoDate(b.date).localeCompare(toIsoDate(a.date)));
}

export function escapeXml(text: string): string {
	return String(text ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

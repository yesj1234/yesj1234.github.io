import type { PageLoad } from './$types';
import { slugFromPath } from '$lib/slugFromPath';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { seriesTitle } from '$lib/series';

export const load: PageLoad = async ({ params }) => {
	const modules = import.meta.glob(`/src/post_items/*.md`);

	let match: { path?: string; resolver?: App.MdsvexResolver } = {};
	for (const [path, resolver] of Object.entries(modules)) {
		if (slugFromPath(path) === params.slug) {
			match = { path, resolver: resolver as unknown as App.MdsvexResolver };
			break;
		}
	}
	const post = await match?.resolver?.();
	// 초안(published: false)은 로컬 dev 서버에서만 미리보기로 연다
	if (!post?.metadata || (!post.metadata.published && !dev)) {
		throw error(404);
	}

	return {
		component: post.default,
		frontmatter: post.metadata,
		series: await loadSeries(modules, post.metadata.series)
	};
};

async function loadSeries(
	modules: Record<string, () => Promise<unknown>>,
	id: string | undefined
): Promise<App.SeriesInfo | null> {
	if (!id) return null;

	const entries = await Promise.all(
		Object.entries(modules).map(async ([path, resolver]) => {
			const { metadata } = (await resolver()) as App.MdsvexFile;
			return { slug: slugFromPath(path) ?? '', metadata };
		})
	);
	const posts = entries
		// 같은 시리즈 글 중 공개된 것만 목차에 넣는다(dev 에서는 초안도 보여 준다)
		.filter(({ metadata }) => metadata?.series === id && (metadata.published || dev))
		.map(({ slug, metadata }) => ({
			slug,
			title: metadata.title,
			order: Number(metadata.seriesOrder ?? 0)
		}))
		.sort((a, b) => a.order - b.order);

	return { id, title: seriesTitle(id), posts };
}

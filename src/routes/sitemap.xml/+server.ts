import { loadPublishedPosts, escapeXml } from '$lib/posts';
import { absoluteUrl } from '$lib/site';
import { toIsoDate } from '$lib/utils/date_utils';

export const prerender = true;

export async function GET() {
	const posts = await loadPublishedPosts();
	const tags = [...new Set(posts.flatMap((post) => (post.tags as unknown as string[]) ?? []))];

	const urls = [
		{ loc: absoluteUrl('/'), lastmod: toIsoDate(posts[0]?.date ?? '') },
		{ loc: absoluteUrl('/about') },
		...posts.map((post) => ({ loc: absoluteUrl(`/posts/${post.slug}`), lastmod: toIsoDate(post.date) })),
		...tags.map((tag) => ({ loc: absoluteUrl(`/tags/${encodeURIComponent(tag)}`) }))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) =>
			`  <url><loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}</url>`
	)
	.join('\n')}
</urlset>
`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

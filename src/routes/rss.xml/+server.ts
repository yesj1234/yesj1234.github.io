import { loadPublishedPosts, escapeXml } from '$lib/posts';
import { absoluteUrl, SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';
import { toRfc822 } from '$lib/utils/date_utils';

export const prerender = true;

export async function GET() {
	const posts = (await loadPublishedPosts()).slice(0, 30);

	const items = posts
		.map((post) => {
			const link = absoluteUrl(`/posts/${post.slug}`);
			const pubDate = toRfc822(post.date);
			const categories = ((post.tags as unknown as string[]) ?? [])
				.map((tag) => `<category>${escapeXml(tag)}</category>`)
				.join('');
			return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.description ?? '')}</description>${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ''}
      ${categories}
    </item>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${absoluteUrl('/')}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
	return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

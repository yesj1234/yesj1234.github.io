import { loadPublishedPosts } from '$lib/posts';
import { absoluteUrl, AUTHOR, SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';
import { SERIES } from '$lib/series';

export const prerender = true;

/** llms.txt 제안 형식(https://llmstxt.org): 제목 → 요약 인용 → 섹션별 링크 목록 */
export async function GET() {
	const posts = await loadPublishedPosts();
	const line = (post: App.BlogPost) =>
		`- [${post.title}](${absoluteUrl(`/posts/${post.slug}`)}): ${post.description ?? ''}`;

	const sections: string[] = [];
	for (const [id, { title }] of Object.entries(SERIES)) {
		const inSeries = posts
			.filter((post) => post.series === id)
			.sort((a, b) => Number(a.seriesOrder ?? 0) - Number(b.seriesOrder ?? 0));
		if (inSeries.length) sections.push(`## 시리즈: ${title}\n\n${inSeries.map(line).join('\n')}`);
	}
	const standalone = posts.filter((post) => !post.series);
	if (standalone.length) sections.push(`## 글\n\n${standalone.map(line).join('\n')}`);

	const body = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

작성자: ${AUTHOR.name} (${AUTHOR.alternateName}), ${AUTHOR.jobTitle}. 소개: ${AUTHOR.url}
모든 글은 한국어로 쓰였어요. 전체 목록은 ${absoluteUrl('/sitemap.xml')}, 구독은 ${absoluteUrl('/rss.xml')} 에 있어요.

${sections.join('\n\n')}
`;
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

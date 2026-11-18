/** frontmatter 날짜(`2026. 11. 18.` 또는 `2024-04-26`)를 [년, 월, 일]로 나눈다. 해석할 수 없으면 null */
function parseParts(raw: string): [string, string, string] | null {
	const [year, month, day] = String(raw ?? '')
		.split(/[.\-/]/)
		.map((part) => part.trim())
		.filter(Boolean);
	if (!year || !month || !day) return null;
	return [year, month.padStart(2, '0'), day.padStart(2, '0')];
}

/** 화면 표시용 `2026. 11. 18.`. 해석할 수 없으면 원문을 돌려준다. */
export function formatPostDate(raw: string): string {
	const parts = parseParts(raw);
	return parts ? `${parts[0]}. ${parts[1]}. ${parts[2]}.` : raw;
}

/** 정렬·sitemap 용 `2026-11-18`. 해석할 수 없으면 빈 문자열(정렬 시 맨 뒤) */
export function toIsoDate(raw: string): string {
	const parts = parseParts(raw);
	return parts ? parts.join('-') : '';
}

/** JSON-LD·article:published_time 용. 글은 한국 시간 기준으로 쓴다 */
export function toIsoDateTime(raw: string): string | undefined {
	const date = toIsoDate(raw);
	return date ? `${date}T00:00:00+09:00` : undefined;
}

/** RSS pubDate 용 RFC 822 */
export function toRfc822(raw: string): string | undefined {
	const iso = toIsoDateTime(raw);
	return iso ? new Date(iso).toUTCString() : undefined;
}

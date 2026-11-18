/** frontmatter 의 `2026. 11. 18.` 같은 날짜를 `2026. 11. 18.` 로 정규화한다. 해석할 수 없으면 원문을 돌려준다. */
export function formatPostDate(raw: string): string {
	const [year, month, day] = String(raw)
		.split('.')
		.map((part) => part.trim())
		.filter(Boolean);
	if (!year || !month || !day) return raw;
	return `${year}. ${month.padStart(2, '0')}. ${day.padStart(2, '0')}.`;
}

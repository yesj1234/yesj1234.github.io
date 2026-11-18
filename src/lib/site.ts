export const SITE_URL = 'https://yesj1234.github.io';
export const SITE_TITLE = 'Jack.dev.blog';
export const SITE_DESCRIPTION =
	'Flutter 앱과 서버(Django·FastAPI)를 함께 만드는 개발자 jack 의 기록. 트러블슈팅, 설계 결정, 앱 아키텍처, AI 에이전트와 일하는 법.';

export const AUTHOR = {
	name: 'Yang Seung Jun',
	alternateName: 'jack',
	jobTitle: 'Flutter Developer',
	url: `${SITE_URL}/about`,
	image: `${SITE_URL}/logo/github-profile.png`,
	sameAs: [
		'https://github.com/yesj1234',
		'https://www.linkedin.com/in/%EC%8A%B9%EC%A4%80-%EC%96%91-859646257/'
	]
};

export function absoluteUrl(path: string): string {
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** `<script type="application/ld+json">` 안에 넣을 문자열. `</script>` 로 끊기지 않게 `<` 를 이스케이프한다 */
export function jsonLd(data: unknown): string {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

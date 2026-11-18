/**
 * 시리즈 목록. 글 frontmatter 의 `series` 값이 여기 키와 같아야 묶인다.
 * 순서는 각 글의 `seriesOrder` 로 정한다.
 */
export const SERIES: Record<string, { title: string }> = {
	'flutter-architecture': { title: 'Flutter 앱을 6개 패키지로 나눈 이유' },
	'ios-native': { title: 'Flutter 앱의 iOS 네이티브 이야기' }
};

export function seriesTitle(id: string): string {
	return SERIES[id]?.title ?? id;
}

/**
 * 글의 카테고리. 글마다 frontmatter `category` 로 정확히 하나를 고른다.
 * 탐색기 폴더와 홈 필터가 이 목록을 쓴다. 태그(0~3개)는 칩과 태그 페이지에만 쓴다.
 */
export type CategoryGroup = 'work' | 'study';

export interface Category {
	id: string;
	title: string;
	group: CategoryGroup;
}

export const GROUPS: { id: CategoryGroup; title: string }[] = [
	{ id: 'work', title: '실무 기록' },
	{ id: 'study', title: '학습 노트' }
];

export const CATEGORIES: Category[] = [
	{ id: 'architecture', title: '아키텍처·상태관리', group: 'work' },
	{ id: 'ios-native', title: 'iOS·네이티브', group: 'work' },
	{ id: 'server', title: '서버·연동', group: 'work' },
	{ id: 'ai', title: 'AI·개발 생산성', group: 'work' },
	{ id: 'retrospective', title: '회고', group: 'work' },
	{ id: 'flutter', title: 'Flutter', group: 'study' },
	{ id: 'dart', title: 'Dart', group: 'study' },
	{ id: 'etc', title: '기타', group: 'study' }
];

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

/** 카테고리가 없거나 목록에 없는 글은 「기타」로 본다 */
export function categoryOf(post: { category?: string }): Category {
	return BY_ID.get(post.category ?? '') ?? (BY_ID.get('etc') as Category);
}

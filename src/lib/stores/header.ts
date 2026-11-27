import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface HeaderFile {
	href: string;
	title: string;
}

// v2: 이전 버전은 이동 중 다른 탭의 제목으로 덮어쓴 값이 저장돼 있을 수 있어 새 키로 비운다
const KEY = 'openedHeaderFiles.v2';

function readSaved(): HeaderFile[] {
	if (!browser) return [];
	try {
		const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function createHeaderStore() {
	const { subscribe, set, update } = writable<HeaderFile[]>(readSaved());
	if (browser) {
		subscribe((value) => {
			try {
				localStorage.setItem(KEY, JSON.stringify(value));
			} catch {
				// 저장소를 못 쓰는 환경(시크릿 창 등)에서는 탭을 세션 동안만 유지한다
			}
		});
	}

	return { subscribe, set, update };
}

export const openedHeaderFiles = createHeaderStore();

export function openTab(file: HeaderFile) {
	openedHeaderFiles.update((prev) => {
		const existing = prev.find((tab) => tab.href === file.href);
		if (!existing) return [...prev, file];
		if (existing.title === file.title) return prev;
		return prev.map((tab) => (tab.href === file.href ? file : tab));
	});
}

/** 열린 탭마다 마지막 스크롤 위치. 이미 열린 글로 다시 가면 읽던 자리로 돌려놓는다 */
const scrollPositions = new Map<string, number>();

export function rememberScroll(href: string, y: number) {
	scrollPositions.set(href, y);
}

export function savedScroll(href: string): number | undefined {
	return scrollPositions.get(href);
}

export function forgetScroll(href: string) {
	scrollPositions.delete(href);
}

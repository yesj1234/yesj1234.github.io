import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface HeaderFile {
	href: string;
	title: string;
}

const KEY = 'openedHeaderFiles';

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

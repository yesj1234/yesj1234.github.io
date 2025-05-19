import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface HeaderFile {
	href: string;
	title: string;
}

const KEY = 'openedHeaderFiles';

function createHeaderStore() {
	const initial = browser ? JSON.parse(localStorage.getItem(KEY) || '[]') : [];
	const { subscribe, set, update } = writable(initial);
	if (browser) {
		subscribe((value) => {
			localStorage.setItem(KEY, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		set,
		update
	};
}

// export const openedHeaderFiles = writable<HeaderFile[]>([]);
export const openedHeaderFiles = createHeaderStore();

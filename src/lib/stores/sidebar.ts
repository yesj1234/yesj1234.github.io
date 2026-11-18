import { writable } from 'svelte/store';

export type SidebarPanel = 'explorer' | 'search';

/** 활동 바에서 열린 패널. null 이면 패널이 닫혀 있다. */
export const activePanel = writable<SidebarPanel | null>('explorer');

export function togglePanel(panel: SidebarPanel) {
	activePanel.update((current) => (current === panel ? null : panel));
}

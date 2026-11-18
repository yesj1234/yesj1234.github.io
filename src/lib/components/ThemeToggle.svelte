<script lang="ts">
	import { onMount } from 'svelte';

	let theme: 'light' | 'dark' = 'light';

	onMount(() => {
		const explicit = document.documentElement.dataset.theme;
		if (explicit === 'light' || explicit === 'dark') {
			theme = explicit;
		} else {
			theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			// 저장소를 못 쓰면 이번 방문 동안만 적용한다
		}
	}
</script>

<button
	type="button"
	class="theme-toggle"
	on:click={toggle}
	title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
	aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
>
	<i class={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-regular fa-moon'}></i>
</button>

<style>
	.theme-toggle {
		all: unset;
		box-sizing: border-box;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		cursor: pointer;
		color: inherit;
	}
</style>

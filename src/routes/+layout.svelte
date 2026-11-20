<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import '../app.pcss';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { GOATCOUNTER_CODE } from '$lib/site';
	import Sidebar from '$lib/components/sidebar/Sidebar.svelte';
	import Header from '$lib/components/header/Header.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { activePanel, togglePanel, type SidebarPanel } from '$lib/stores/sidebar';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: posts = (data.publishedPosts ?? []) as unknown as App.BlogPost[];

	// 모바일에서는 패널을 서랍으로 띄운다. 데스크톱 패널 상태(activePanel)와 따로 둬서 첫 화면에 서랍이 열리지 않게 한다
	let drawerOpen = false;

	function openDrawer(panel: SidebarPanel) {
		activePanel.set(panel);
		drawerOpen = true;
	}

	afterNavigate((navigation) => {
		drawerOpen = false;
		// 첫 진입은 스크립트가 로드되며 직접 센다. 그 뒤 화면 전환만 여기서 센다
		if (!dev && navigation.type !== 'enter') {
			window.goatcounter?.count({ path: location.pathname, referrer: '' });
		}
	});

	$: isPost = $page.url.pathname.startsWith('/posts/');

	// 코드 블록 머리줄의 복사 버튼. 글마다 붙이지 않고 문서 전체에서 한 번만 듣는다
	onMount(() => {
		const onClick = async (event: MouseEvent) => {
			const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.code-copy');
			const code = button?.closest('.code-block')?.querySelector('pre');
			if (!button || !code) return;
			try {
				await navigator.clipboard.writeText(code.innerText);
				button.textContent = '복사됨';
				button.classList.add('copied');
			} catch {
				button.textContent = '복사 실패';
			}
			setTimeout(() => {
				button.textContent = '복사';
				button.classList.remove('copied');
			}, 1500);
		};
		document.addEventListener('click', onClick);
		return () => document.removeEventListener('click', onClick);
	});
</script>

<svelte:head>
	{#if !dev}
		<script data-goatcounter={`https://${GOATCOUNTER_CODE}.goatcounter.com/count`} async src="https://gc.zgo.at/count.js"></script>
	{/if}
</svelte:head>

<div class="shell" class:panel-open={$activePanel !== null} class:drawer-open={drawerOpen}>
	<nav class="activity" aria-label="활동 바">
		<button
			type="button"
			class="activity-item"
			class:selected={$activePanel === 'explorer'}
			on:click={() => togglePanel('explorer')}
			title="탐색기"
			aria-label="탐색기"
		>
			<i class="fa-regular fa-copy"></i>
		</button>
		<button
			type="button"
			class="activity-item"
			class:selected={$activePanel === 'search'}
			on:click={() => togglePanel('search')}
			title="검색"
			aria-label="검색"
		>
			<i class="fa-solid fa-magnifying-glass"></i>
		</button>
		<div class="activity-spacer"></div>
		<a
			class="activity-item"
			class:selected={$page.url.pathname === '/about'}
			href="/about"
			title="소개"
			aria-label="소개"
		>
			<i class="fa-regular fa-user"></i>
		</a>
		<a
			class="activity-item"
			href="https://github.com/yesj1234"
			target="_blank"
			rel="noreferrer"
			title="GitHub"
			aria-label="GitHub"
		>
			<i class="fa-brands fa-github"></i>
		</a>
		<div class="activity-item"><ThemeToggle /></div>
	</nav>

	<aside class="panel" aria-label="사이드 패널">
		<Sidebar {posts} />
	</aside>

	<button
		type="button"
		class="backdrop"
		aria-label="패널 닫기"
		tabindex="-1"
		on:click={() => (drawerOpen = false)}
	></button>

	<div class="editor">
		<header class="mobile-bar">
			<button type="button" class="mobile-btn" on:click={() => openDrawer('explorer')} aria-label="글 목록 열기">
				<i class="fa-solid fa-bars"></i>
			</button>
			<a href="/" class="mobile-title">Jack.dev.blog</a>
			<button type="button" class="mobile-btn" on:click={() => openDrawer('search')} aria-label="검색 열기">
				<i class="fa-solid fa-magnifying-glass"></i>
			</button>
			<div class="mobile-btn"><ThemeToggle /></div>
		</header>

		<div class="tabs-bar"><Header /></div>

		<main class="content">
			<slot />
		</main>
	</div>

	<footer class="statusbar">
		<span class="status-item"><i class="fa-solid fa-code-branch"></i> main</span>
		<span class="status-item">글 {posts.length}개</span>
		<span class="status-spacer"></span>
		{#if isPost}<span class="status-item">Markdown</span>{/if}
		<span class="status-item">UTF-8</span>
	</footer>
</div>

<style>
	.shell {
		min-height: 100vh;
	}

	/* ---------- 활동 바 ---------- */
	.activity {
		position: fixed;
		top: 0;
		left: 0;
		bottom: var(--status-h);
		width: var(--activity-w);
		display: flex;
		flex-direction: column;
		background: var(--bg-activity);
		border-right: 1px solid var(--border);
		z-index: 30;
	}

	.activity-item {
		all: unset;
		box-sizing: border-box;
		position: relative;
		display: grid;
		place-items: center;
		width: var(--activity-w);
		height: var(--activity-w);
		font-size: 20px;
		color: var(--text-faint);
		cursor: pointer;
	}

	.activity-item:hover {
		color: var(--text);
	}

	.activity-item.selected {
		color: var(--text);
	}

	.activity-item.selected::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--accent);
	}

	.activity-spacer {
		flex: 1;
	}

	/* ---------- 사이드 패널 ---------- */
	.panel {
		position: fixed;
		top: 0;
		left: var(--activity-w);
		bottom: var(--status-h);
		width: var(--panel-w);
		background: var(--bg-side);
		border-right: 1px solid var(--border);
		z-index: 20;
		transform: translateX(calc(-100% - var(--activity-w)));
		visibility: hidden;
		transition:
			transform 0.2s ease,
			visibility 0.2s;
	}

	.panel-open .panel {
		transform: none;
		visibility: visible;
	}

	.backdrop {
		display: none;
	}

	/* ---------- 에디터 영역 ---------- */
	.editor {
		margin-left: var(--activity-w);
		padding-bottom: var(--status-h);
		min-width: 0;
		transition: margin-left 0.2s ease;
	}

	.panel-open .editor {
		margin-left: calc(var(--activity-w) + var(--panel-w));
	}

	.tabs-bar {
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.mobile-bar {
		display: none;
	}

	.content {
		min-width: 0;
	}

	/* ---------- 상태 바 ---------- */
	.statusbar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: var(--status-h);
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 0 8px;
		font-size: 12px;
		background: var(--statusbar);
		color: var(--statusbar-text);
		z-index: 40;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 0 6px;
		white-space: nowrap;
	}

	.status-spacer {
		flex: 1;
	}

	/* ---------- 모바일 ---------- */
	@media (max-width: 767px) {
		.activity,
		.tabs-bar,
		.statusbar {
			display: none;
		}

		.panel {
			top: 0;
			left: 0;
			bottom: 0;
			width: min(84vw, 320px);
			z-index: 60;
			transform: translateX(-100%);
			visibility: hidden;
		}

		.panel-open .panel {
			transform: translateX(-100%);
			visibility: hidden;
		}

		.drawer-open .panel {
			transform: none;
			visibility: visible;
		}

		.backdrop {
			all: unset;
			position: fixed;
			inset: 0;
			z-index: 50;
			background: rgba(0, 0, 0, 0.35);
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.2s ease;
		}

		.drawer-open .backdrop {
			opacity: 1;
			pointer-events: auto;
		}

		.editor,
		.panel-open .editor {
			margin-left: 0;
			padding-bottom: 0;
		}

		.mobile-bar {
			position: sticky;
			top: 0;
			z-index: 10;
			display: flex;
			align-items: center;
			gap: 4px;
			height: 52px;
			padding: 0 8px;
			background: color-mix(in srgb, var(--bg) 92%, transparent);
			backdrop-filter: blur(8px);
			border-bottom: 1px solid var(--border);
		}

		.mobile-title {
			flex: 1;
			font-weight: 700;
			font-size: 16px;
			padding-left: 4px;
		}

		.mobile-btn {
			all: unset;
			box-sizing: border-box;
			display: grid;
			place-items: center;
			width: 40px;
			height: 40px;
			font-size: 18px;
			color: var(--text-muted);
			cursor: pointer;
		}
	}
</style>

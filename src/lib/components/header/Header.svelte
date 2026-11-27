<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { forgetScroll, openedHeaderFiles } from '$lib/stores/header';

	function closeTab(href: string) {
		const tabs = $openedHeaderFiles;
		const index = tabs.findIndex((tab) => tab.href === href);
		const remaining = tabs.filter((tab) => tab.href !== href);
		openedHeaderFiles.set(remaining);
		forgetScroll(href);

		if (href !== $page.url.pathname) return;
		// 닫은 탭이 지금 화면이면 VS Code 처럼 옆 탭으로 옮겨 간다
		const next = remaining[Math.min(index, remaining.length - 1)];
		goto(next ? next.href : '/');
	}
</script>

<nav class="tabs" aria-label="열린 글">
	<a href="/" class="tab home" class:active={$page.url.pathname === '/'} title="홈">
		<i class="fa-solid fa-house icon"></i>
		<span class="name">홈</span>
	</a>
	{#each $openedHeaderFiles as file (file.href)}
		<div class="tab" class:active={file.href === $page.url.pathname}>
			<a href={file.href} class="link" title={file.title}>
				<i class="fa-brands fa-markdown icon md"></i>
				<span class="name">{file.title}</span>
			</a>
			<button
				type="button"
				class="close"
				on:click={() => closeTab(file.href)}
				aria-label={`${file.title} 탭 닫기`}
			>
				<i class="fa-solid fa-xmark"></i>
			</button>
		</div>
	{/each}
</nav>

<style>
	.tabs {
		display: flex;
		height: var(--tabs-h);
		background: var(--bg-tabs);
		border-bottom: 1px solid var(--border);
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tab {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		max-width: 240px;
		height: 100%;
		font-size: 13px;
		color: var(--text-muted);
		border-right: 1px solid var(--border);
		background: var(--bg-tabs);
	}

	.tab.home {
		gap: 6px;
		padding: 0 14px;
	}

	.tab:hover {
		color: var(--text);
	}

	.tab.active {
		color: var(--text);
		background: var(--bg-tab-active);
		margin-bottom: -1px;
		height: calc(100% + 1px);
	}

	.tab.active::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--accent);
	}

	.link {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		height: 100%;
		padding: 0 4px 0 12px;
	}

	.icon {
		flex: none;
		font-size: 12px;
	}

	.icon.md {
		color: var(--accent);
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.close {
		all: unset;
		flex: none;
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		margin-right: 6px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		visibility: hidden;
	}

	.tab:hover .close,
	.tab.active .close,
	.close:focus-visible {
		visibility: visible;
	}

	.close:hover {
		background: var(--bg-hover);
	}
</style>

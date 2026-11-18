<script lang="ts">
	import SidebarFolder from '$lib/components/sidebar/SidebarFolder.svelte';
	import SidebarSearch from '$lib/components/sidebar/SidebarSearch.svelte';
	import { page } from '$app/stores';
	import { activePanel } from '$lib/stores/sidebar';
	import { SERIES, seriesTitle } from '$lib/series';

	export let posts: App.BlogPost[] = [];
	export let tags: string[] = [];

	let isRootOpen = true;
	let isSeriesOpen = true;

	$: panel = $activePanel ?? 'explorer';

	function postsOf(tag: string) {
		return posts.filter((post) => post.tags?.includes(tag));
	}

	$: activePost = posts.find((post) => $page.url.pathname === `/posts/${post.slug}`);
	// 시리즈 글이면 시리즈 폴더를, 아니면 첫 태그 폴더 하나만 펼친다
	$: openSeries = activePost?.series;
	$: openTag = openSeries ? undefined : (activePost?.tags as unknown as string[] | undefined)?.[0];

	$: seriesIds = Object.keys(SERIES).filter((id) => posts.some((post) => post.series === id));

	function postsInSeries(id: string) {
		return posts
			.filter((post) => post.series === id)
			.sort((a, b) => Number(a.seriesOrder ?? 0) - Number(b.seriesOrder ?? 0));
	}
</script>

<div class="panel">
	<div class="panel-title">{panel === 'search' ? '검색' : '탐색기'}</div>

	{#if panel === 'explorer'}
		{#if seriesIds.length}
			<button type="button" class="section" on:click={() => (isSeriesOpen = !isSeriesOpen)}>
				<i class="fa-solid fa-chevron-right chevron" class:open={isSeriesOpen}></i>
				<span>SERIES</span>
			</button>
			{#if isSeriesOpen}
				<div class="tree">
					{#each seriesIds as id (id)}
						<SidebarFolder name={seriesTitle(id)} posts={postsInSeries(id)} autoOpen={id === openSeries} />
					{/each}
				</div>
			{/if}
		{/if}
		<button type="button" class="section" on:click={() => (isRootOpen = !isRootOpen)}>
			<i class="fa-solid fa-chevron-right chevron" class:open={isRootOpen}></i>
			<span>YESJ1234.GITHUB.IO</span>
		</button>
		{#if isRootOpen}
			<div class="tree">
				{#each tags as tag (tag)}
					<SidebarFolder name={tag} posts={postsOf(tag)} autoOpen={tag === openTag} />
				{/each}
			</div>
		{/if}
	{:else}
		<SidebarSearch {posts} />
	{/if}
</div>

<style>
	.panel {
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		font-size: 13px;
		color: var(--text-muted);
	}

	.panel-title {
		flex: none;
		height: var(--tabs-h);
		display: flex;
		align-items: center;
		padding: 0 20px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.section {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 4px;
		width: 100%;
		height: 22px;
		padding: 0 8px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text);
		cursor: pointer;
	}

	.section:hover {
		background: var(--bg-hover);
	}

	.chevron {
		width: 16px;
		font-size: 10px;
		text-align: center;
		transition: transform 0.15s ease;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.tree {
		padding: 2px 0 12px;
	}
</style>

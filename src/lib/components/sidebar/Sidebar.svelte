<script lang="ts">
	import SidebarFolder from '$lib/components/sidebar/SidebarFolder.svelte';
	import SidebarSearch from '$lib/components/sidebar/SidebarSearch.svelte';
	import { page } from '$app/stores';
	import { activePanel } from '$lib/stores/sidebar';
	import { SERIES, seriesTitle } from '$lib/series';
	import { CATEGORIES, GROUPS, categoryOf, type CategoryGroup } from '$lib/categories';

	export let posts: App.BlogPost[] = [];

	let isSeriesOpen = true;
	let openGroups: Record<CategoryGroup, boolean> = { work: true, study: true };

	$: panel = $activePanel ?? 'explorer';

	$: activePost = posts.find((post) => $page.url.pathname === `/posts/${post.slug}`);
	// 시리즈 글이면 시리즈 폴더를, 아니면 그 글의 카테고리 폴더 하나만 펼친다
	$: openSeries = activePost?.series;
	$: openCategory = activePost && !openSeries ? categoryOf(activePost).id : undefined;

	$: seriesIds = Object.keys(SERIES).filter((id) => posts.some((post) => post.series === id));

	function postsInSeries(id: string) {
		return posts
			.filter((post) => post.series === id)
			.sort((a, b) => Number(a.seriesOrder ?? 0) - Number(b.seriesOrder ?? 0));
	}

	function postsInCategory(id: string) {
		return posts.filter((post) => categoryOf(post).id === id);
	}

	function categoriesIn(group: CategoryGroup) {
		return CATEGORIES.filter((category) => category.group === group && postsInCategory(category.id).length > 0);
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
		{#each GROUPS as group (group.id)}
			{#if categoriesIn(group.id).length}
				<button type="button" class="section" on:click={() => (openGroups[group.id] = !openGroups[group.id])}>
					<i class="fa-solid fa-chevron-right chevron" class:open={openGroups[group.id]}></i>
					<span>{group.title}</span>
				</button>
				{#if openGroups[group.id]}
					<div class="tree">
						{#each categoriesIn(group.id) as category (category.id)}
							<SidebarFolder
								name={category.title}
								posts={postsInCategory(category.id)}
								autoOpen={category.id === openCategory}
							/>
						{/each}
					</div>
				{/if}
			{/if}
		{/each}
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

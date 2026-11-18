<script lang="ts">
	import Fuse from 'fuse.js';
	import { onDestroy } from 'svelte';

	export let posts: App.BlogPost[] = [];

	let query = '';
	let debouncedQuery = '';
	let debounceTimeout: ReturnType<typeof setTimeout>;

	$: {
		clearTimeout(debounceTimeout);
		const next = query;
		debounceTimeout = setTimeout(() => (debouncedQuery = next), 200);
	}

	onDestroy(() => clearTimeout(debounceTimeout));

	$: fuse = new Fuse(posts, {
		keys: ['title', 'description', 'tags'],
		threshold: 0.4
	});

	$: results = debouncedQuery.trim().length > 1 ? fuse.search(debouncedQuery.trim()).map((r) => r.item) : [];
</script>

<div class="search">
	<input
		type="search"
		placeholder="글 제목·설명·태그 검색"
		bind:value={query}
		class="input"
		aria-label="글 검색"
	/>

	{#if debouncedQuery.trim().length > 1}
		<p class="summary">{results.length}개의 결과</p>
	{/if}

	<ul class="results">
		{#each results as post (post.slug)}
			<li>
				<a href={`/posts/${post.slug}`} class="result">
					<span class="title"><i class="fa-brands fa-markdown md-icon"></i>{post.title}</span>
					{#if post.description}<span class="desc">{post.description}</span>{/if}
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.search {
		padding: 0 12px 12px 20px;
	}

	.input {
		box-sizing: border-box;
		width: 100%;
		height: 26px;
		padding: 0 8px;
		font: inherit;
		font-size: 13px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 2px;
	}

	.input:focus {
		outline: 1px solid var(--accent);
		outline-offset: -1px;
	}

	.summary {
		margin: 10px 0 4px;
		font-size: 12px;
		color: var(--text-faint);
	}

	.results {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.result {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px 8px;
		margin: 0 -8px;
		border-radius: 3px;
	}

	.result:hover {
		background: var(--bg-hover);
	}

	.title {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text);
	}

	.desc {
		padding-left: 18px;
		font-size: 12px;
		color: var(--text-faint);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.md-icon {
		font-size: 12px;
		color: var(--accent);
	}
</style>

<script lang="ts">
	import Fuse from 'fuse.js';
	import { onDestroy } from 'svelte';
	import { openedHeaderFiles } from '$lib/stores/header';
	import type { HeaderFile } from '$lib/stores/header';

	export let searchQuery: string;
	export let onQueryChange: (value: string) => void;
	export let posts: App.BlogPost[];

	let debouncedQuery = '';
	let debounceTimeout: ReturnType<typeof setTimeout>;

	$: if (searchQuery !== debouncedQuery) {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			debouncedQuery = searchQuery;
		}, 300);
	}

	onDestroy(() => clearTimeout(debounceTimeout));

	const fuse = new Fuse(posts, {
		keys: ['title', 'content'],
		includeScore: true,
		threshold: 0.4 // adjust for stricter/looser matching
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;

		onQueryChange(target.value);
	}
	function addHeaderFile(post: App.BlogPost) {
		let href = post.slug
			? `/posts/${post.slug}`
			: '#' +
				post.title
					.toLowerCase()
					.replace(/[^a-zA-Z ]/g, '')
					.replace(/\s/g, '-');

		openedHeaderFiles.update((prev) => {
			const isDuplicate = prev.some((file: HeaderFile) => file.title === post.title);
			if (isDuplicate) {
				return prev;
			} else {
				return [...prev, { href, title: post.title }];
			}
		});
	}

	$: filteredPosts =
		debouncedQuery && debouncedQuery.length > 1
			? fuse.search(debouncedQuery).map((result) => result.item)
			: [];
</script>

<div class="container">
	<div class="search-bar">
		<input
			type="text"
			placeholder="Search posts"
			bind:value={searchQuery}
			on:input={handleInput}
			class="search-input"
		/>
	</div>
	<div class="search-results">
		{#each filteredPosts as post}
			<a href={`/posts/${post.slug}`} on:click={() => addHeaderFile(post)} class="search-result"
				>{post.title}</a
			>
		{/each}
	</div>
</div>

<style>
	.container {
		padding-top: 30px;
	}
	.search-bar {
		margin-left: auto;
		margin-right: auto;
		padding-left: 5px;
		padding-right: 5px;
	}
	.search-input {
		width: 90%;
		padding: 8px;
		font-size: 16px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	.search-results {
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.search-result {
		color: #444;
		text-decoration: none;
		font-size: 16px;
		padding: 4px;
		border-radius: 4px;
	}
	.search-result:hover {
		background-color: #dcdcdc;
	}
</style>

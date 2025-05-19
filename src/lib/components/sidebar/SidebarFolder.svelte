<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { openedHeaderFiles } from '$lib/stores/header';
	import type { HeaderFile } from '$lib/stores/header';
	let is_folder_open = false;
	function toggleFolder() {
		is_folder_open = !is_folder_open;
	}
	const folder_transition = {
		duration: 300,
		easing: quintOut
	};

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
	export let name: String;
	export let data;
</script>

<button class="tag-folder" on:click={toggleFolder}>
	<span class="arrow-icon" class:rotated={is_folder_open}>
		<i class="fa-solid fa-chevron-right"></i>
	</span>
	{#if !is_folder_open}
		<i class="fa-solid fa-folder"></i>
	{:else}
		<i class="fa-solid fa-folder-open"></i>
	{/if}

	<span>{name}</span>
</button>
<div class:closed={!is_folder_open} class="title">
	{#if is_folder_open}
		<div class="items" transition:slide={folder_transition}>
			{#each data as post}
				<div class="item">
					<a
						on:click={() => addHeaderFile(post)}
						href={post.slug
							? `/posts/${post.slug}`
							: '#' +
								post.title
									.toLowerCase()
									.replace(/[^a-zA-Z ]/g, '')
									.replace(/\s/g, '-')}>{post.title}.md</a
					>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.item {
		padding-left: 10px;
		padding-bottom: 10px;
	}
	.arrow-icon {
		display: inline-block;
		margin-right: 0.5rem;
		transition: transform 0.3s ease;
		color: gray;
	}

	.item {
		display: flex;
		flex-direction: column;
		color: gray;
	}
	.title {
		padding-left: 35px;
		overflow: hidden;
		font-size: 15px;
	}
	.rotated {
		transform: rotate(90deg);
	}
	button.tag-folder {
		all: unset;
		cursor: pointer;
		padding-left: 20px;
		padding-right: 5px;
	}
	button.tag-folder:hover,
	button.tag-folder:focus-visible {
		outline: none; /* prevents default blue outline */
		border-radius: 4px; /* optional: gives a soft edge */
	}
	.closed {
		height: 0px;
		transition: height 0.3s ease;
	}
</style>

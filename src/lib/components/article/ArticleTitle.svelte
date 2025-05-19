<script lang="ts">
	import { openedHeaderFiles } from '$lib/stores/header';
	import type { HeaderFile } from '$lib/stores/header';
	export let slug = '';
	export let title: string;

	const id = title
		.toLowerCase()
		.replace(/[^a-zA-Z ]/g, '')
		.replace(/\s/g, '-');

	const href = slug ? `/posts/${slug}` : '#' + id;
	function addHeaderFile() {
		openedHeaderFiles.update((prev) => {
			const isDuplicate = prev.some((file: HeaderFile) => file.title === title);
			if (isDuplicate) {
				return prev;
			} else {
				return [...prev, { href, title: title }];
			}
		});
	}
</script>

{#if slug}
	<h3 class="heading" class:large={!slug} {id}>
		<a on:click={addHeaderFile} {href}>
			{title}
		</a>
	</h3>
{:else}
	<h2 class="heading" class:large={!slug} {id}>
		<a {href}>
			{title}
		</a>
	</h2>
{/if}

<style>
	h2 {
		margin: 0;
	}
	.heading {
		margin: 0;
		font-size: 1.8rem;
	}
	.large {
		margin-top: calc(var(--spacing-unit) * 12);
		font-size: 2.2rem;
	}
</style>

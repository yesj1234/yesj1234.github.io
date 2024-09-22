<script lang="ts">
	import type { PageData } from './$types';
	// import type { SvelteComponentTyped } from 'svelte/internal';
	import PageHead from '$lib/components/PageHead.svelte';
	import ArticleTitle from '$lib/components/ArticleTitle.svelte';
	import ArticleMeta from '$lib/components/ArticleMeta.svelte';
	export let data: PageData;
	// type C = $$Generic<typeof SvelteComponentTyped<any, any, any>>;
	$: component = data.component;
</script>

<PageHead title={data.frontmatter.title} description={data.frontmatter.description} />
<div class="metadata">
	<ArticleTitle title={data.frontmatter.title} />
	<ArticleMeta date={data.frontmatter.date} tags={data.frontmatter.tags} />
</div>

<div class="component">
	<svelte:component this={component} />
</div>

<style>
	.metadata {
		padding-left: calc(var(--spacing-unit) * 10);
		padding-right: calc(var(--spacing-unit) * 10);
	}
	.component {
		padding-left: calc(var(--spacing-unit) * 10);
		width: 70%;
	}
</style>

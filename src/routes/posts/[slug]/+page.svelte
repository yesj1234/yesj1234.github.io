<script lang="ts">
	import type { PageData } from './$types';

	import PageHead from '$lib/components/PageHead.svelte';
	import ArticleTitle from '$lib/components/article/ArticleTitle.svelte';
	import ArticleMeta from '$lib/components/article/ArticleMeta.svelte';
	export let data: PageData;

	$: component = data.component;
</script>

<div class="container">
	<div class="metadata">
		<PageHead title={data.frontmatter.title} description={data.frontmatter.description} />
		<ArticleTitle title={data.frontmatter.title} />
		<ArticleMeta date={data.frontmatter.date} tags={data.frontmatter.tags} />
	</div>

	<div class="component">
		<svelte:component this={component} />
	</div>
</div>

<style>
	.container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		@media only screen and (min-width: 1024px) {
			margin-left: auto;
			margin-right: auto;
			width: calc(100%-20rem);
		}
	}
	.metadata {
		width: 80%;
		padding-left: calc(var(--spacing-unit) * 10);
	}
	.component {
		padding-left: calc(var(--spacing-unit) * 10);
		width: 80%;
		border: 1px black;
	}
</style>

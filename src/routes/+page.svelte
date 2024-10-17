<script lang="ts">
	import type { PageData } from './$types';
	import PageHead from '$lib/components/PageHead.svelte';
	import Article from '$lib/components/Article.svelte';
	import ArticleTitle from '$lib/components/ArticleTitle.svelte';
	import ArticleMeta from '$lib/components/ArticleMeta.svelte';
	import ArticleDescription from '$lib/components/ArticleDescription.svelte';
	export let data: PageData;
</script>

<PageHead title="Home" description="An awesome blog about development with Svelte" />

{#each data.posts as { slug, title, description, date, tags }}
	<Article>
		<ArticleTitle {slug} {title} />
		<ArticleMeta {date} {tags} />
		<ArticleDescription {description} {slug} />
	</Article>
	<hr />
{/each}

<slot />

<style>
	hr {
		border: 0;
		height: 1px;
		background-image: linear-gradient(
			to right,
			rgba(0, 0, 0, 0),
			rgba(0, 0, 0, 0.75),
			rgba(0, 0, 0, 0)
		);
		width: 90%;
	}
</style>

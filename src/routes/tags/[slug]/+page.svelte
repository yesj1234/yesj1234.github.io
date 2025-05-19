<script lang="ts">
	import type { PageData } from './$types';
	import Article from '$lib/components/article/Article.svelte';
	import ArticleTitle from '$lib/components/article/ArticleTitle.svelte';
	import ArticleMeta from '$lib/components/article/ArticleMeta.svelte';
	import ArticleDescription from '$lib/components/article/ArticleDescription.svelte';

	export let data: PageData;
</script>

{#each data.posts as { slug, title, description, date, tags }}
	<Article>
		<ArticleTitle {slug} {title} />
		<ArticleMeta {date} {tags} />
		<ArticleDescription {description} {slug} />
	</Article>
	<hr />
{/each}

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

<script lang="ts">
	import type { PageData } from './$types';
	import Article from '$lib/components/Article.svelte';
	import ArticleTitle from '$lib/components/ArticleTitle.svelte';
	import ArticleMeta from '$lib/components/ArticleMeta.svelte';
	import ArticleDescription from '$lib/components/ArticleDescription.svelte';

	export let data: PageData;
</script>

{#each data.posts as { slug, title, author, description, date, tags }}
	<Article>
		<ArticleTitle {slug} {title} />
		<ArticleMeta {author} {date} {tags} />
		<ArticleDescription {description} {slug} />
	</Article>
{/each}

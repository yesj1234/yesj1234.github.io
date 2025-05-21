<script lang="ts">
	import type { PageData } from './$types';
	import PageHead from '$lib/components/PageHead.svelte';
	import Article from '$lib/components/article/Article.svelte';
	import ArticleTitle from '$lib/components/article/ArticleTitle.svelte';
	import ArticleMeta from '$lib/components/article/ArticleMeta.svelte';
	import ArticleDescription from '$lib/components/article/ArticleDescription.svelte';
	export let data: PageData;
</script>

<PageHead title="Home" description="An awesome blog about development with Svelte" />

<div class="container">
	<div class="blog-title">
		<span class="jack">Jack.dev.blog</span>
		<!-- svelte-ignore a11y-img-redundant-alt -->
		<div class="image">
			<span>by</span>
			<a href="https://github.com/yesj1234"
				><img src="/logo/github-profile.png" alt="profile-image" /></a
			>
		</div>
	</div>
	{#each data.posts as { slug, title, description, date, tags }}
		<Article>
			<ArticleTitle {slug} {title} />
			<ArticleMeta {date} {tags} />
			<ArticleDescription {description} {slug} />
		</Article>
		<hr />
	{/each}
</div>

<slot />

<style>
	.container {
		width: 50vw;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		margin-top: 2rem;
		@media only screen and (min-width: 1024px) {
			margin-left: auto;
			margin-right: auto;
		}
		@media only screen and (max-width: 768px) {
			width: 100vw;
		}
	}

	.jack {
		font-size: 30px;
		font-weight: bold;
		@media only screen and (max-width: 768px) {
			font-size: 15px;
		}
	}
	.blog-title {
		display: flex;
		margin-top: calc(var(--spacing-unit) * 8);
		padding-left: calc(var(--spacing-unit) * 20);
		padding-right: calc(var(--spacing-unit) * 20);
		align-items: center;
		place-content: space-between;
		@media only screen and (max-width: 768px) {
			font-size: 1rem;
		}
	}

	.image {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.image span {
		font-style: italic;
	}
	img {
		border-radius: 9999px;
		width: 50px;
		height: 50px;
		margin-left: 10px;
		@media only screen and (max-width: 768px) {
			width: 30px;
			height: 30px;
		}
	}
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

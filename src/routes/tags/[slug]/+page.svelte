<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import PageHead from '$lib/components/PageHead.svelte';
	import PostList from '$lib/components/PostList.svelte';

	export let data: PageData;

	$: tag = decodeURIComponent($page.params.slug);
</script>

<PageHead title={`#${tag}`} description={`${tag} 태그가 붙은 글`} />

<div class="page">
	<header class="head">
		<p class="label">태그</p>
		<h1 class="title">#{tag}</h1>
		<p class="count">글 {data.posts.length}개</p>
	</header>
	<PostList posts={data.posts} />
</div>

<style>
	.page {
		max-width: 760px;
		margin: 0 auto;
		padding: 56px 32px 96px;
	}

	.head {
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border);
	}

	.label {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--text-faint);
	}

	.title {
		margin: 4px 0 0;
		font-size: 1.8rem;
		font-weight: 750;
		letter-spacing: -0.02em;
	}

	.count {
		margin: 6px 0 0;
		font-size: 14px;
		color: var(--text-muted);
	}

	@media (max-width: 767px) {
		.page {
			padding: 28px 20px 64px;
		}
	}
</style>

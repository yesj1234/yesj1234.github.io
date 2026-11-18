<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import PageHead from '$lib/components/PageHead.svelte';
	import { openTab } from '$lib/stores/header';
	import { formatPostDate } from '$lib/utils/date_utils';

	export let data: PageData;

	$: component = data.component;
	$: meta = data.frontmatter as unknown as App.BlogPost;
	$: tags = (meta.tags ?? []) as unknown as string[];
	$: if (browser) openTab({ href: $page.url.pathname, title: meta.title });
</script>

<PageHead title={meta.title} description={meta.description} />

<div class="page">
	<div class="breadcrumb" aria-hidden="true">
		<span>yesj1234.github.io</span>
		<i class="fa-solid fa-chevron-right sep"></i>
		<span>posts</span>
		<i class="fa-solid fa-chevron-right sep"></i>
		<span class="file"><i class="fa-brands fa-markdown"></i>{$page.params.slug}.md</span>
	</div>

	<header class="head">
		<h1 class="title">{meta.title}</h1>
		{#if meta.description}<p class="desc">{meta.description}</p>{/if}
		<div class="meta">
			<time>{formatPostDate(meta.date)}</time>
			{#if tags.length}
				<span class="dot" aria-hidden="true">·</span>
				<span class="tags">
					{#each tags as tag}<a class="chip" href={`/tags/${tag}`}>{tag}</a>{/each}
				</span>
			{/if}
			{#if !meta.published}<span class="draft">초안</span>{/if}
		</div>
	</header>

	<article class="prose">
		<svelte:component this={component} />
	</article>
</div>

<style>
	.page {
		max-width: 760px;
		margin: 0 auto;
		padding: 20px 32px 120px;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 40px;
		font-size: 12px;
		color: var(--text-faint);
	}

	.sep {
		font-size: 8px;
	}

	.file {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: var(--text-muted);
	}

	.file i {
		color: var(--accent);
	}

	.head {
		margin-bottom: 40px;
		padding-bottom: 28px;
		border-bottom: 1px solid var(--border);
	}

	.title {
		margin: 0;
		font-size: 2.1rem;
		font-weight: 750;
		line-height: 1.3;
		letter-spacing: -0.025em;
		word-break: keep-all;
	}

	.desc {
		margin: 14px 0 0;
		font-size: 17px;
		line-height: 1.7;
		color: var(--text-muted);
		word-break: keep-all;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 20px;
		font-size: 14px;
		color: var(--text-faint);
	}

	.meta time {
		font-family: var(--font-mono);
		font-size: 13px;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		font-size: 12px;
		line-height: 1;
		padding: 5px 8px;
		border-radius: 999px;
		background: var(--chip-bg);
		color: var(--text-muted);
	}

	.chip:hover {
		color: var(--accent);
	}

	.draft {
		font-size: 12px;
		padding: 3px 8px;
		border-radius: 4px;
		border: 1px dashed var(--text-faint);
	}

	@media (max-width: 767px) {
		.page {
			padding: 16px 20px 72px;
		}

		.breadcrumb {
			display: none;
		}

		.head {
			margin-top: 12px;
		}

		.title {
			font-size: 1.65rem;
		}
	}
</style>

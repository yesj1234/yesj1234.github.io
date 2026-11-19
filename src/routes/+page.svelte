<script lang="ts">
	import type { PageData } from './$types';
	import PageHead from '$lib/components/PageHead.svelte';
	import PostList from '$lib/components/PostList.svelte';
	import { AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '$lib/site';
	import { GROUPS, categoryOf, type CategoryGroup } from '$lib/categories';

	export let data: PageData;

	let filter: 'all' | CategoryGroup = 'work';
	$: posts = data.posts as unknown as App.BlogPost[];
	$: countOf = (group: CategoryGroup) => posts.filter((post) => categoryOf(post).group === group).length;
	$: visible = filter === 'all' ? posts : posts.filter((post) => categoryOf(post).group === filter);

	const path = '/';
	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: SITE_URL,
				name: SITE_TITLE,
				description: SITE_DESCRIPTION,
				inLanguage: 'ko',
				author: { '@id': `${SITE_URL}/about#person` }
			},
			{
				'@type': 'Person',
				'@id': `${SITE_URL}/about#person`,
				name: AUTHOR.name,
				alternateName: AUTHOR.alternateName,
				jobTitle: AUTHOR.jobTitle,
				url: AUTHOR.url,
				image: AUTHOR.image,
				sameAs: AUTHOR.sameAs
			}
		]
	};
</script>

<PageHead title="" {path} {structuredData} />

<div class="page">
	<header class="intro">
		<a href="https://github.com/yesj1234" target="_blank" rel="noreferrer" class="avatar-link">
			<img src="/logo/github-profile.png" alt="yesj1234 프로필 사진" class="avatar" />
		</a>
		<div>
			<h1 class="name">Jack.dev.blog</h1>
			<p class="handle">
				<a href="https://github.com/yesj1234" target="_blank" rel="noreferrer">@yesj1234</a>
				<span aria-hidden="true">·</span>
				<a href="/about">소개</a>
				<span aria-hidden="true">·</span>
				글 {data.posts.length}개
			</p>
		</div>
	</header>

	<div class="filters" role="tablist" aria-label="글 분류">
		{#each GROUPS as group (group.id)}
			<button
				type="button"
				role="tab"
				class="filter"
				class:active={filter === group.id}
				aria-selected={filter === group.id}
				on:click={() => (filter = group.id)}
			>
				{group.title} <span class="count">{countOf(group.id)}</span>
			</button>
		{/each}
		<button
			type="button"
			role="tab"
			class="filter"
			class:active={filter === 'all'}
			aria-selected={filter === 'all'}
			on:click={() => (filter = 'all')}
		>
			전체 <span class="count">{posts.length}</span>
		</button>
	</div>
	<PostList posts={visible} />
</div>

<style>
	.page {
		max-width: 760px;
		margin: 0 auto;
		padding: 56px 32px 96px;
	}

	.intro {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 48px;
	}

	.avatar {
		display: block;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid var(--border);
	}

	.name {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 750;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.handle {
		margin: 4px 0 0;
		display: flex;
		gap: 6px;
		font-size: 14px;
		color: var(--text-muted);
	}

	.handle a:hover {
		color: var(--accent);
	}

	.filters {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--border);
	}

	.filter {
		all: unset;
		cursor: pointer;
		position: relative;
		padding: 8px 12px 10px;
		font-size: 14px;
		color: var(--text-muted);
	}

	.filter:hover {
		color: var(--text);
	}

	.filter.active {
		color: var(--text);
		font-weight: 600;
	}

	.filter.active::after {
		content: '';
		position: absolute;
		left: 8px;
		right: 8px;
		bottom: -1px;
		height: 2px;
		background: var(--accent);
	}

	.count {
		margin-left: 2px;
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 400;
		color: var(--text-faint);
	}


	@media (max-width: 767px) {
		.page {
			padding: 28px 20px 64px;
		}

		.intro {
			margin-bottom: 32px;
		}
	}
</style>

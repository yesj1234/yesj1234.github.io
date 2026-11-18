<script lang="ts">
	import type { PageData } from './$types';
	import PageHead from '$lib/components/PageHead.svelte';
	import PostList from '$lib/components/PostList.svelte';

	export let data: PageData;
</script>

<PageHead title="" description="Jack 의 개발 블로그" />

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
				글 {data.posts.length}개
			</p>
		</div>
	</header>

	<h2 class="section-label">최근 글</h2>
	<PostList posts={data.posts} />
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

	.section-label {
		margin: 0;
		padding-bottom: 8px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-faint);
		border-bottom: 1px solid var(--border);
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

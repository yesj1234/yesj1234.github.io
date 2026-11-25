<script lang="ts">
	import type { PageData } from './$types';
	import PageHead from '$lib/components/PageHead.svelte';
	import { AUTHOR, SITE_URL } from '$lib/site';
	import { SERIES } from '$lib/series';

	export let data: PageData;

	// 이력서 링크로 들어온 사람이 가장 먼저 볼 글. 순서대로 보여 준다
	const FEATURED = [
		'ios_crashlytics_zero_crashes',
		'bloc_concurrency_refactor',
		'live_activity_push_to_start',
		'ai_pr_review_skill',
		'deferred_deeplink_in_house'
	];

	$: posts = (data.publishedPosts ?? []) as unknown as App.BlogPost[];
	$: featured = FEATURED.map((slug) => posts.find((post) => post.slug === slug)).filter(
		(post): post is App.BlogPost => Boolean(post)
	);
	$: seriesLinks = Object.entries(SERIES).map(([id, series]) => {
		const first = posts
			.filter((post) => post.series === id)
			.sort((a, b) => Number(a.seriesOrder ?? 0) - Number(b.seriesOrder ?? 0))[0];
		const count = posts.filter((post) => post.series === id).length;
		return { title: series.title, href: first ? `/posts/${first.slug}` : undefined, count };
	});

	const path = '/about';
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'ProfilePage',
		url: `${SITE_URL}${path}`,
		mainEntity: {
			'@type': 'Person',
			'@id': `${SITE_URL}/about#person`,
			name: AUTHOR.name,
			alternateName: AUTHOR.alternateName,
			jobTitle: AUTHOR.jobTitle,
			url: AUTHOR.url,
			image: AUTHOR.image,
			sameAs: AUTHOR.sameAs,
			knowsAbout: ['Flutter', 'Dart', 'BLoC', 'Django', 'FastAPI', 'iOS', 'WidgetKit', 'ActivityKit', 'watchOS', 'Wear OS']
		}
	};

	// 소개 문구는 저자가 직접 다듬는 자리다
	const focus = [
		{ title: '앱', body: 'Flutter(BLoC, Clean Architecture) 로 웰니스 앱을 만들어요.' },
		{ title: '서버', body: 'Django·FastAPI 로 앱이 쓰는 API 와 배치 작업을 함께 맡아요.' },
		{ title: '네이티브', body: '홈 위젯, Live Activity, Apple Watch·Wear OS 처럼 Flutter 바깥의 표면도 다뤄요.' },
		{ title: 'AI 와 일하기', body: 'AI 코딩 에이전트가 읽을 규칙과 도구를 만들어 팀 저장소에서 쓰고 있어요.' }
	];
</script>

<PageHead title="소개" description="Flutter 앱과 서버를 함께 만드는 개발자 jack 의 소개" {path} type="profile" {structuredData} />

<div class="page">
	<header class="intro">
		<img src="/logo/github-profile.png" alt="" class="avatar" width="72" height="72" />
		<div>
			<h1 class="name">Yang Seung Jun <span class="alias">jack</span></h1>
			<p class="role">Flutter 로 앱을 만들고, 그 앱이 쓰는 서버까지 함께 만드는 개발자예요.</p>
		</div>
	</header>

	<section>
		<h2 class="label">대표 작업</h2>
		<ul class="works">
			{#each featured as post}
				<li>
					<a class="work-title" href={`/posts/${post.slug}`}>{post.title}</a>
					{#if post.summary}
						<p class="work-result">{post.summary.result}</p>
						<p class="work-stack">{post.summary.stack}</p>
					{:else}
						<p class="work-result">{post.description}</p>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2 class="label">하는 일</h2>
		<ul class="focus">
			{#each focus as item}
				<li><strong>{item.title}</strong><span>{item.body}</span></li>
			{/each}
		</ul>
	</section>

	<section>
		<h2 class="label">시리즈</h2>
		<ul class="links">
			{#each seriesLinks as series}
				<li>
					{#if series.href}<a href={series.href}>{series.title}</a>{:else}{series.title}{/if}
					<span class="count">{series.count}편</span>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2 class="label">링크</h2>
		<ul class="links">
			<li><a href="https://github.com/yesj1234" target="_blank" rel="noreferrer me"><i class="fa-brands fa-github"></i> github.com/yesj1234</a></li>
			<li><a href={AUTHOR.sameAs[1]} target="_blank" rel="noreferrer me"><i class="fa-brands fa-linkedin"></i> LinkedIn</a></li>
			<li><a href="/rss.xml"><i class="fa-solid fa-rss"></i> RSS 구독</a></li>
		</ul>
	</section>
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
		gap: 20px;
		margin-bottom: 48px;
	}

	.avatar {
		flex: none;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid var(--border);
	}

	.name {
		margin: 0;
		font-size: 1.7rem;
		font-weight: 750;
		letter-spacing: -0.02em;
	}

	.alias {
		margin-left: 6px;
		font-family: var(--font-mono);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-faint);
	}

	.role {
		margin: 6px 0 0;
		color: var(--text-muted);
		line-height: 1.6;
		word-break: keep-all;
	}

	section + section {
		margin-top: 40px;
	}

	.label {
		margin: 0 0 12px;
		padding-bottom: 8px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--text-faint);
		border-bottom: 1px solid var(--border);
	}

	.works {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.works li {
		padding: 14px 0;
		border-bottom: 1px solid var(--border);
	}

	.works li:last-child {
		border-bottom: none;
	}

	.work-title {
		font-size: 1.05rem;
		font-weight: 650;
		line-height: 1.5;
		color: var(--text);
		word-break: keep-all;
	}

	.work-title:hover {
		color: var(--accent);
	}

	.work-result {
		margin: 6px 0 0;
		line-height: 1.65;
		color: var(--text-muted);
		word-break: keep-all;
	}

	.work-stack {
		margin: 4px 0 0;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-faint);
	}

	.count {
		margin-left: 8px;
		font-size: 12px;
		color: var(--text-faint);
	}

	.focus,
	.links {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.focus li {
		display: grid;
		grid-template-columns: 96px 1fr;
		gap: 12px;
		padding: 10px 0;
		line-height: 1.6;
		word-break: keep-all;
	}

	.focus span {
		color: var(--text-muted);
	}

	.links li {
		padding: 6px 0;
		color: var(--text-muted);
	}

	.links a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--text);
	}

	.links a:hover {
		color: var(--accent);
	}

	@media (max-width: 767px) {
		.page {
			padding: 28px 20px 64px;
		}

		.focus li {
			grid-template-columns: 1fr;
			gap: 2px;
		}
	}
</style>

<script lang="ts">
	export let series: App.SeriesInfo;
	export let currentSlug: string;
	/** toc: 글 위 시리즈 목차 / pager: 글 아래 이전·다음 글 */
	export let variant: 'toc' | 'pager' = 'toc';

	$: index = series.posts.findIndex((post) => post.slug === currentSlug);
	$: prev = index > 0 ? series.posts[index - 1] : null;
	$: next = index >= 0 && index < series.posts.length - 1 ? series.posts[index + 1] : null;

	let isOpen = false;
</script>

{#if variant === 'toc'}
	<nav class="toc" aria-label="시리즈 목차">
		<button type="button" class="toc-head" on:click={() => (isOpen = !isOpen)} aria-expanded={isOpen}>
			<span class="label">시리즈</span>
			<span class="name">{series.title}</span>
			<span class="position">{index + 1} / {series.posts.length}</span>
			<i class="fa-solid fa-chevron-down chevron" class:open={isOpen}></i>
		</button>
		{#if isOpen}
			<ol class="list">
				{#each series.posts as post, i (post.slug)}
					<li class:current={post.slug === currentSlug}>
						<span class="num">{i + 1}</span>
						{#if post.slug === currentSlug}
							<span class="title">{post.title}</span>
						{:else}
							<a class="title" href={`/posts/${post.slug}`}>{post.title}</a>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</nav>
{:else if prev || next}
	<nav class="pager" aria-label="시리즈 이전·다음 글">
		{#if prev}
			<a class="page-link prev" href={`/posts/${prev.slug}`}>
				<span class="dir"><i class="fa-solid fa-arrow-left"></i> 이전 글</span>
				<span class="page-title">{prev.title}</span>
			</a>
		{:else}
			<span></span>
		{/if}
		{#if next}
			<a class="page-link next" href={`/posts/${next.slug}`}>
				<span class="dir">다음 글 <i class="fa-solid fa-arrow-right"></i></span>
				<span class="page-title">{next.title}</span>
			</a>
		{/if}
	</nav>
{/if}

<style>
	.toc {
		margin: 0 0 32px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg-side);
		overflow: hidden;
	}

	.toc-head {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 12px 16px;
		cursor: pointer;
		font-size: 14px;
	}

	.toc-head:hover {
		background: var(--bg-hover);
	}

	.label {
		flex: none;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		padding: 3px 7px;
		border-radius: 4px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.name {
		flex: 1;
		min-width: 0;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.position {
		flex: none;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-faint);
	}

	.chevron {
		flex: none;
		font-size: 11px;
		color: var(--text-faint);
		transition: transform 0.15s ease;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 4px 16px 12px;
		border-top: 1px solid var(--border);
	}

	.list li {
		display: flex;
		gap: 10px;
		padding: 6px 0;
		font-size: 14px;
		line-height: 1.5;
	}

	.num {
		flex: none;
		width: 18px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-faint);
		padding-top: 2px;
	}

	.list a.title {
		color: var(--text-muted);
	}

	.list a.title:hover {
		color: var(--accent);
	}

	.list li.current .title {
		font-weight: 600;
		color: var(--text);
	}

	.pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 56px;
		padding-top: 28px;
		border-top: 1px solid var(--border);
	}

	.page-link {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px 16px;
		border: 1px solid var(--border);
		border-radius: 8px;
		transition: border-color 0.15s ease;
	}

	.page-link:hover {
		border-color: var(--accent);
	}

	.page-link.next {
		grid-column: 2;
		text-align: right;
	}

	.dir {
		font-size: 12px;
		color: var(--text-faint);
	}

	.page-title {
		font-weight: 600;
		line-height: 1.45;
		word-break: keep-all;
	}

	@media (max-width: 767px) {
		.pager {
			grid-template-columns: 1fr;
		}

		.page-link.next {
			grid-column: 1;
		}
	}
</style>

<script lang="ts">
	import { formatPostDate } from '$lib/utils/date_utils';

	export let posts: App.BlogPost[] = [];
</script>

<ul class="list">
	{#each posts as post (post.slug)}
		<li>
			<a class="item" href={`/posts/${post.slug}`}>
				<time class="date">{formatPostDate(post.date)}</time>
				<span class="title">{post.title}</span>
				{#if post.description}<span class="desc">{post.description}</span>{/if}
				{#if post.tags?.length}
					<span class="tags">
						{#each post.tags as tag}<span class="chip">{tag}</span>{/each}
					</span>
				{/if}
			</a>
		</li>
	{/each}
</ul>

<style>
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.list li + li {
		border-top: 1px solid var(--border);
	}

	.item {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 22px 0;
	}

	.date {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-faint);
	}

	.title {
		font-size: 1.2rem;
		font-weight: 650;
		line-height: 1.4;
		letter-spacing: -0.01em;
		color: var(--text);
		transition: color 0.15s ease;
	}

	.item:hover .title {
		color: var(--accent);
	}

	.desc {
		font-size: 15px;
		color: var(--text-muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 2px;
	}

	.chip {
		font-size: 12px;
		line-height: 1;
		padding: 5px 8px;
		border-radius: 999px;
		background: var(--chip-bg);
		color: var(--text-muted);
	}
</style>

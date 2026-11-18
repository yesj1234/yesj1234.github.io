<script lang="ts">
	import { page } from '$app/stores';

	export let name: string;
	export let posts: App.BlogPost[] = [];
	/** 지금 보는 글의 대표 폴더면 펼쳐 둔다. 글이 여러 태그에 걸려도 폴더 하나만 열리게 부모가 고른다 */
	export let autoOpen = false;

	let isOpen = false;
	$: if (autoOpen) isOpen = true;
</script>

<button type="button" class="row folder" on:click={() => (isOpen = !isOpen)}>
	<i class="fa-solid fa-chevron-right chevron" class:open={isOpen}></i>
	<span class="label">{name}</span>
	<span class="count">{posts.length}</span>
</button>

{#if isOpen}
	<ul class="files">
		{#each posts as post (post.slug)}
			<li>
				<a
					class="row file"
					class:active={$page.url.pathname === `/posts/${post.slug}`}
					href={`/posts/${post.slug}`}
					title={post.title}
				>
					<i class="fa-brands fa-markdown md-icon"></i>
					<span class="label">{post.title}</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.row {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		height: 22px;
		cursor: pointer;
		color: var(--text);
		white-space: nowrap;
	}

	.row:hover {
		background: var(--bg-hover);
	}

	.folder {
		padding: 0 12px 0 16px;
	}

	.file {
		padding: 0 12px 0 38px;
	}

	.file.active {
		background: var(--bg-selected);
	}

	.chevron {
		width: 16px;
		font-size: 10px;
		text-align: center;
		color: var(--text-muted);
		transition: transform 0.15s ease;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.count {
		font-size: 11px;
		color: var(--text-faint);
	}

	.md-icon {
		flex: none;
		font-size: 12px;
		color: var(--accent);
	}

	.files {
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>

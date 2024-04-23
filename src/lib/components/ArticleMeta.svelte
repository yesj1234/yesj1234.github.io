<script lang="ts">
	export let author: string;
	export let date: string;
	export let tags: string | string[];
	const formattedDate = new Date(date).toDateString();
</script>

<p>
	{#if tags}
		<div class="tags">
			<span>Tags: </span>
			{#each tags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	{/if}
	<span class="author">{author}</span>
	<span class="date">{formattedDate}</span>
</p>

<style>
	p {
		margin: 0;
		margin-bottom: calc(var(--spacing-unit) * 4);
		margin-top: calc(var(--spacing-unit) * 2);
		display: flex;
		flex-direction: row;
		justify-content: end;
	}
	.tags {
		margin-right: auto;
		font-weight: 500;
		color: royalblue;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}
	.tag {
		/* border: solid 1px black; */
		background-color: aqua;
		border-radius: 10%;
		padding-left: 5px;
		padding-right: 5px;
		margin-right: calc(var(--spacing-unit) * 1);
	}
	.author {
		font-weight: bold;
		margin-right: calc(var(--spacing-unit) * 2);
	}
	.date {
		color: var(--color-text-secondary);
	}
</style>

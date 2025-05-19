<script lang="ts">
	// export let author: string;
	export let date: string;
	export let tags: string;
	import moment from 'moment';

	const [year, month, day, _] = date.split('.');

	const publishedDate = moment(`${year.trim()}-${month.trim()}-${day.trim()}`);
</script>

<p>
	{#if tags}
		<div class="tags">
			<span>Tags: </span>
			<div class="tag-items-container">
				{#each tags as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		</div>
	{/if}
</p>
<div class="metadata">
	<span class="date">{publishedDate.format('YYYY. MM. DD. (ddd)')}</span>
</div>

<style>
	p {
		margin: 0;
		margin-bottom: calc(var(--spacing-unit) * 2);
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
		background-color: white;
		border-radius: 10%;
		padding-left: 5px;
		padding-right: 5px;
		margin-right: 5px;
	}
	.tag-items-container {
		margin-left: calc(var(--spacing-unit) * 1);
	}

	.date {
		color: var(--color-text-secondary);
	}
	.metadata {
		display: flex;
		flex-direction: column;
	}
</style>

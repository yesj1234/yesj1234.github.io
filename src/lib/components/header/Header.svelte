<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { openedHeaderFiles } from '$lib/stores/header';

	function removeItem(idx: number) {
		let currentPath = $page.url.pathname;

		openedHeaderFiles.update((prev) => {
			const fileToRemove = prev[idx];
			const updated = prev.filter((_: any, i: number) => i !== idx);
			if (fileToRemove?.href === currentPath) {
				if (updated.length > 0) {
					const lastFile = updated[updated.length - 1];
					goto(lastFile.href);
				} else {
					goto('/');
				}
			}
			return updated;
		});
	}
</script>

<div>
	<div class="container">
		{#if $openedHeaderFiles.length > 0}
			{#each $openedHeaderFiles as file, idx}
				<div class="item {file.href === $page.url.pathname ? 'active' : ''}">
					<div class="file-name"><a href={file.href}><p>{file.title}</p></a></div>
					<button on:click={() => removeItem(idx)}>X</button>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.container {
		width: 100vw;
		height: 30px;
		background-color: #e9e9e8;

		display: flex;
		flex-direction: row;
	}

	.item {
		display: flex;
		max-width: 200px;
		padding-left: 10px;
		border: 1px solid #dad9d9;
		/* overflow-x: hidden;
		overflow-y: hidden; */
	}

	.item.active {
		background-color: white;
		border-bottom: 2px solid #007acc; /* VS Code-style active indicator */
		color: black;
		font-weight: bold;
	}
	.file-name {
		max-width: 180px;
		border: 0;
	}
	.item:hover {
		background-color: white;
	}
	p {
		margin: 0;
		font-size: 15px;

		text-overflow: ellipsis;
		/* both the following line needs to be ellipsis */
		white-space: nowrap;
		overflow: hidden;
	}
	button {
		opacity: 0;
		cursor: pointer;
		border: 0;
		background-color: transparent;
		transition: opacity 0.2s ease;
	}
	.item:hover button,
	button:hover {
		display: inline;
		opacity: 1;
	}
	button:hover {
		background-color: grey;
	}
</style>

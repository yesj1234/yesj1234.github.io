<script lang="ts">
	export let summary: App.PostSummary;

	const rows: { key: keyof App.PostSummary; label: string }[] = [
		{ key: 'problem', label: '문제' },
		{ key: 'role', label: '내 역할' },
		{ key: 'result', label: '결과' },
		{ key: 'stack', label: '기술' }
	];
</script>

<aside class="summary" aria-label="요약">
	<p class="heading">30초 요약</p>
	<dl>
		{#each rows as row}
			{#if summary[row.key]}
				<div class="row" class:stack={row.key === 'stack'}>
					<dt>{row.label}</dt>
					<dd>{summary[row.key]}</dd>
				</div>
			{/if}
		{/each}
	</dl>
</aside>

<style>
	.summary {
		margin: 0 0 40px;
		padding: 18px 22px;
		background: var(--accent-soft);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: 0 8px 8px 0;
	}

	.heading {
		margin: 0 0 10px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--accent);
	}

	dl {
		margin: 0;
	}

	.row {
		display: grid;
		grid-template-columns: 64px 1fr;
		gap: 12px;
		padding: 5px 0;
		line-height: 1.65;
		word-break: keep-all;
	}

	dt {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-muted);
	}

	dd {
		margin: 0;
		font-size: 15px;
	}

	.stack dd {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-muted);
	}

	@media (max-width: 767px) {
		.summary {
			padding: 14px 16px;
		}

		.row {
			grid-template-columns: 1fr;
			gap: 0;
		}
	}
</style>

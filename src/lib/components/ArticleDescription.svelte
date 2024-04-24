<script lang="ts">
	export let description: string;
	export let slug = '';
	const href = slug && `/posts/${slug}`;
</script>

<p>
	{description}
</p>
<hr />

<style>
	p {
		margin: 0;
		margin-bottom: calc(var(--spacing-unit) * 8);
	}
</style>

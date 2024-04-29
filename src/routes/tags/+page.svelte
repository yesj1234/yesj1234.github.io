<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1>#Tags</h1>
{#each data.tags as tags}
	<h2><a href="/tags/{tags}">{tags}</a></h2>
{/each}

<slot />

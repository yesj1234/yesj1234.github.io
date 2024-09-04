<script lang="ts">
	import { page } from '$app/stores';
</script>

<div>
	<a href="/"><h1 class:small={$page.url.pathname !== '/'}>Jack.dev.blog</h1></a>
</div>

<style>
	div {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		/* background-color: var(--color-background); */
		/* background-color: white; */
	}
</style>

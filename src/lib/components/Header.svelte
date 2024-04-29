<script lang="ts">
	import { page } from '$app/stores';
</script>

<div>
	<a href="/"><h1 class:small={$page.url.pathname !== '/'}>Jack.dev.blog</h1></a>
</div>

<style>
	.small {
		font-size: 1.6rem;
	}
	div {
		background-color: white;
		width: 100%;
	}
</style>

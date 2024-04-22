<script lang="ts">
	import { page } from '$app/stores';
</script>

<a href="/"><h1 class:small={$page.url.pathname !== '/'}>Jack.dev.blog</h1></a>

<style>
	.small {
		font-size: 1.6rem;
	}
</style>

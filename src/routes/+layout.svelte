<script lang="ts">
	import '../app.pcss';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="header-container">
	<Header></Header>
</div>
<div class="sidebar-and-main">
	<div class="sidebar-container">
		<Sidebar tags={data.tags}></Sidebar>
	</div>
	<div class="main">
		<main>
			<slot></slot>
		</main>
	</div>
</div>
<div class="footer-container">
	<Footer></Footer>
</div>

<style>
	:global(:root) {
		--spacing-unit: 4px;
		--color-background: #e5e5e5;
		--color-text-primary: #212121;
		--color-text-secondary: #5a5a5a;
		--color-hover: #007bff;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		max-width: 100vw;
		/* padding: calc(var(--spacing-unit) * 8); */
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
			'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osz-font-smoothing: grayscale;
		background-color: var(--color-background);
		color: var(--color-text-primary);
		line-height: 1.51;
		font-size: 18px;
		/* height: 100vh; */
	}

	:global(a, a:visited, a:active) {
		text-decoration: none;
		color: var(--color-text-primary);
		font-weight: 700;
	}

	:global(a:hover) {
		text-decoration: none;
		color: var(--color-hover);
	}
	.sidebar-and-main {
		display: flex;
		flex-direction: row;
		justify-content: start;
		height: 100vh;
	}
	.header-container {
		/* position: sticky; */
		position: fixed;
		top: 0;
		border-bottom: 1px black solid;
		width: 100%;
		height: 6rem;
		background-color: #c3beb9;
	}
	.sidebar-container {
		position: sticky;
		top: 6rem;
		align-self: flex-start;
		padding-top: 10px;
	}
	.footer-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	main {
		padding-top: 70px;
	}
	div.main {
		width: 100%;
		height: 100%;
		overflow: auto;
	}
</style>

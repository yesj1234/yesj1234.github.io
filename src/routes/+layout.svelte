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

<div class="containers">
	<div class="sidebar-container">
		<Sidebar tags={data.tags}></Sidebar>
	</div>

	<div class="main">
		<main>
			<slot></slot>
		</main>
	</div>
</div>
<Footer></Footer>

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
		padding: 10;
		box-sizing: border-box;

		max-width: 100vw;
		padding: calc(var(--spacing-unit) * 8);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
			'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osz-font-smoothing: grayscale;
		background-color: var(--color-background);
		color: var(--color-text-primary);
		line-height: 1.51;
		font-size: 18px;
		height: 300vh;
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
	.containers {
		height: 100vh;
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		gap: 10rem;
	}
	.header-container {
		top: 0;
		position: sticky;
		width: 100%;
		border: 1px black solid;
		background-color: white;
	}
	.sidebar-container {
		position: sticky;
		top: 0;
		border: black 1px dotted;
		width: 23.6%;
	}
</style>

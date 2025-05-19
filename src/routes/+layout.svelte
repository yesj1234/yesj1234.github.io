<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import '../app.pcss';
	import Sidebar2 from '$lib/components/sidebar/Sidebar.svelte';
	import type { PageData } from './$types';
	import Header2 from '$lib/components/header/Header.svelte';
	export let data: PageData;
</script>

<div class="sidebar-and-main">
	<div class="sidebar2">
		<Sidebar2 {data} tags={data.tags}></Sidebar2>
	</div>

	<div class="main">
		<div class="header-container"><Header2></Header2></div>
		<slot></slot>
	</div>
</div>

<style>
	:global(:root) {
		--spacing-unit: 4px;
		--color-background: #ffffff;
		--color-text-primary: #212121;
		--color-text-secondary: #5a5a5a;
		--color-text-sidebar-item: grey;
		--color-hover: #007bff;
		--color-default: #90a4ae;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		width: 100vw;
		height: 100vh;
		max-width: 100vw;
		max-height: 100vh;
		overflow-x: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
			'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osz-font-smoothing: grayscale;
		background-color: var(--color-background);
		color: var(--color-text-primary);
		line-height: 1.51;
		font-size: 18px;
	}

	:global(a, a:visited, a:active) {
		text-decoration: none;
		color: var(--color-text-sidebar-item);
		font-weight: 700;
	}

	:global(a:hover) {
		text-decoration: none;
		color: var(--color-hover);
	}
	:global(ol.toc-level-1) {
		list-style: upper-roman;
	}
	:global(ol.toc-level-2) {
		list-style: lower-roman;
	}
	:global(ol.toc-level-3) {
		list-style: circle;
	}
	:global(blockquote) {
		color: lightseagreen;
	}
	:global(code) {
		background-color: #f2f1f1;
		opacity: 0.9;
		z-index: 0;
	}

	.sidebar-and-main {
		display: flex;
		flex-direction: row;
		justify-content: start;
		width: 100vw;
	}

	.header-container {
		position: fixed;
		top: 0;
		left: 50px;
		width: 100vw;
	}

	.sidebar2 {
		position: fixed;
		top: 0;
	}
	.main {
		width: 100vw;
		height: 100%;
		padding-top: rem;
		padding-left: 7rem;
		@media only screen and (min-width: 1024px) {
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>

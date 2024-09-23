<script lang="ts">
	import '../app.pcss';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { Drawer, Button, CloseButton } from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';
	import type { PageData } from './$types';
	export let data: PageData;

	let hidden1 = true;
	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn
	};
</script>

<div class="header-container">
	<div class="sidebarNavBtn">
		<button on:click={() => (hidden1 = false)}><i class="fa-solid fa-bars"></i></button>
	</div>
	<Drawer
		transitionType="fly"
		{transitionParams}
		bind:hidden={hidden1}
		id="sidebarNav"
		width="w-70"
	>
		<Sidebar tags={data.tags}></Sidebar>
	</Drawer>
	<Header></Header>
</div>
<div class="sidebar-and-main">
	<div class="sidebar-container">
		<Sidebar tags={data.tags}></Sidebar>
	</div>
	<div class="main">
		<slot></slot>
	</div>
</div>

<style>
	:global(:root) {
		--spacing-unit: 4px;
		--color-background: #ffffff;
		--color-text-primary: #212121;
		--color-text-secondary: #5a5a5a;
		--color-hover: #007bff;
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
		border-left-style: solid;
		border-left-width: 1.5px;
		border-left-color: rgb(37, 206, 21);
		box-shadow: 2px 2px 15px #ccc;
	}
	:global(code) {
		background-color: #f2f1f1;
		opacity: 0.9;
	}
	.sidebar-and-main {
		display: flex;
		flex-direction: row;
		justify-content: start;
		width: 100%;
		height: 100%;
		padding-top: 5rem;
		/* height: 100vh; */
		/* max-height: 100vh; */
	}
	.sidebarNavBtn {
		display: block;
		padding-top: 2rem;
		@media only screen and (min-width: 1024px) {
			display: none;
		}
	}
	.sidebarNav {
		display: block;
		@media only screen and (min-width: 1024px) {
			display: block;
		}
	}

	.header-container {
		/* position: sticky; */
		position: fixed;
		top: 0;
		border-bottom: 1px black solid;
		width: 100%;
		height: 6rem;
		background-color: #a9a9a9;
		display: flex;
	}
	.sidebar-container {
		display: none;
		@media only screen and (min-width: 1024px) {
			position: fixed;
			top: 6rem;
			align-self: flex-start;
			padding-top: 10px;
			display: block;
		}
	}

	div.main {
		width: 100%;
		height: 100%;
		@media only screen and (min-width: 1024px) {
			padding-left: 15rem;
		}
	}
</style>

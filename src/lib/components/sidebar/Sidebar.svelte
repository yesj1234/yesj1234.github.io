<script lang="ts">
	import SidebarFolder from '$lib/components/sidebar/SidebarFolder.svelte';
	import SidebarSearch from '$lib/components/sidebar/SidebarSearch.svelte';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let data;
	export let tags;

	let isOpen = false;
	let is_root_folder_open = false;
	let selectedMenu: string | null = null;
	let searchQuery = '';

	const openSidebarFoldersWidth = '250px';

	const root_folder_transition = {
		duration: 300,
		easing: quintOut
	};
	function onSelectMenu(itemName: string | null) {
		selectedMenu = itemName;
	}
	function openFolderFinder() {
		// if the sidebar nav was opened, and clicking again the same nav tap, should close the sidebar nav.
		if (isOpen) {
			if (selectedMenu === 'folders') {
				isOpen = !isOpen;
				return;
			} else {
				onSelectMenu('folders');
				return;
			}
		}
		// else open the selected sidebar nav.
		onSelectMenu('folders');
		isOpen = !isOpen; // isOpen is now true;
	}

	function openSearchBar() {
		if (isOpen) {
			if (selectedMenu === 'search') {
				isOpen = !isOpen;
				return;
			} else {
				onSelectMenu('search');
				return;
			}
		}
		onSelectMenu('search');
		isOpen = !isOpen;
	}
	function toggleRootFolder() {
		is_root_folder_open = !is_root_folder_open;
	}

	function extractTagSpecificTitles(data: { publishedPosts: [App.BlogPost] }, targetTag: string) {
		const matchingPosts = data.publishedPosts.filter((post) => post.tags.includes(targetTag));
		return matchingPosts;
	}

	$: filteredPosts = searchQuery
		? data.publishedPosts.filter((post: any) =>
				(post.title + post.content).toLowerCase().includes(searchQuery.toLowerCase())
			)
		: [];
</script>

<div class="container">
	<div class="sidebar">
		<div class="menu">
			<button
				type="button"
				class="menu-item"
				on:click={openFolderFinder}
				class:selected={selectedMenu === 'folders'}
			>
				<i class="fa-regular fa-copy"></i>
			</button>
			<button class="menu-item" on:click={openSearchBar} class:selected={selectedMenu === 'search'}>
				<i class="fa-solid fa-magnifying-glass"></i>
			</button>
			<button class="menu-item" class:selected={selectedMenu === 'home'}>
				<a href="/"><i class="fa-solid fa-house"></i></a>
			</button>
		</div>
	</div>

	<div
		class:closed={!isOpen}
		class="sidebar-selected"
		style={`width: ${isOpen ? openSidebarFoldersWidth : '0px'}; transition: width 0.3s ease;`}
	>
		{#if selectedMenu === 'folders'}
			<button on:click={toggleRootFolder} class="root-folder"
				><div class="root-folder-title">
					<span class="arrow-icon" class:rotated={is_root_folder_open}>
						<i class="fa-solid fa-chevron-right"></i>
					</span>
					<span class="root-folder">YESJ1234.GITHUB.IO</span>
				</div>
			</button>
			{#if is_root_folder_open}
				<div class="root-items" transition:slide={root_folder_transition}>
					{#each tags as tag}
						<SidebarFolder name={tag} data={extractTagSpecificTitles(data, tag)}></SidebarFolder>
					{/each}
				</div>
			{/if}
		{:else if selectedMenu === 'search'}
			<SidebarSearch
				{searchQuery}
				onQueryChange={(val) => (searchQuery = val)}
				posts={data.publishedPosts}
			></SidebarSearch>
		{/if}
	</div>
</div>

<style>
	div.root-folder-title {
		display: flex;
		flex-direction: row;
		padding-top: 20px;
	}

	span.root-folder {
		font-size: 20px;
		color: #8a8a8a;
	}
	.arrow-icon {
		display: inline-block;
		margin-right: 0.5rem;
		transition: transform 0.3s ease;
		color: gray;
	}
	.rotated {
		transform: rotate(90deg);
	}
	div.root-items {
		display: flex;
		flex-direction: column;
		color: #8a8a8a;
	}
	button.root-folder {
		all: unset;
		cursor: pointer;
	}
	button.root-folder:hover,
	button.root-folder:focus-visible {
		outline: none; /* prevents default blue outline */
		border-radius: 4px; /* optional: gives a soft edge */
	}

	.sidebar-selected {
		display: flex;
		flex-direction: column;
		padding-top: 10px;
		overflow-x: hidden;
	}
	.closed {
		/* width: 0px; */
		overflow: hidden;
		/* transition: width 0.3s ease; */
	}
	.menu {
		width: 50px;
	}
	.menu-item {
		all: unset;
		cursor: pointer;
		padding-left: 10px;
		margin-bottom: 20px;
		padding-right: 10px;
		font-size: 30px;
		display: flex;
		align-items: center;
		color: #8a8a8a;
	}
	button.menu-item:hover,
	button.menu-item:focus-visible {
		background-color: lightgrey;
		outline: none; /* prevents default blue outline */
		border-radius: 4px; /* optional: gives a soft edge */
	}
	button.menu-item:active {
		background-color: #444;
		transform: scale(0.97); /* optional: subtle press animation */
	}

	.container {
		display: flex;
		max-width: 400px;
		height: 100vh;
		background-color: #e9e9e8;
		flex-direction: row;
	}

	.sidebar {
		background-color: #e9e9e8;
		transition: width 0.3s ease;
		overflow: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		padding-top: 1rem;
	}
	.selected {
		color: black;
		border-radius: 4px;
	}
</style>

<script lang="ts">
	import {
		Sidebar,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		SidebarBrand
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	$: activeUrl = $page.url.pathname;
	export let tags: Set<string>;
	let site = {
		name: 'Jack.dev.blog',
		href: '/',
		img: '/logo/logo.jpg'
	};
</script>

<Sidebar {activeUrl}>
	<SidebarBrand {site} imgClass="rounded-full box-border w-8 h-8 mr-1" />
	<SidebarWrapper class="bg-gray-300">
		<SidebarGroup class="list-none bg-gray-400">
			{#each tags as tag}
				<SidebarItem label={tag} href="/tags/{tag}" class="m-1 text-black"></SidebarItem>
				<hr />
			{/each}
		</SidebarGroup>
	</SidebarWrapper>
</Sidebar>

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
		img: '/logo/frog.jpeg'
	};
</script>

<Sidebar {activeUrl}>
	<SidebarBrand {site} imgClass="rounded-full box-border w-8 h-8 mr-1" />
	<SidebarWrapper>
		<SidebarGroup class="list-none ">
			{#each tags as tag}
				<SidebarItem label={tag} href="/tags/{tag}" class="m-1 text-black"></SidebarItem>
				<hr />
			{/each}
		</SidebarGroup>
	</SidebarWrapper>
</Sidebar>

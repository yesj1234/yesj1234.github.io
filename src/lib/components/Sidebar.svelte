<script lang="ts">
	import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
	import { page } from '$app/stores';
	$: activeUrl = $page.url.pathname;
	export let tags: Set<string>;
</script>

<Sidebar {activeUrl}>
	<SidebarWrapper>
		<SidebarGroup class="list-none ">
			{#each tags as tag}
				<SidebarItem label={tag} href="/tags/{tag}" class="m-1 text-xl font-semibold text-black"
				></SidebarItem>
				<hr />
			{/each}
		</SidebarGroup>
	</SidebarWrapper>
</Sidebar>

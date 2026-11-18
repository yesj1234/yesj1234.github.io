<script lang="ts">
	export let title: string;
	export let description: string;
	/** 사이트 루트 기준 경로(`/posts/x/cover.webp`). 공유 미리보기 이미지로 쓴다 */
	export let image: string | undefined = undefined;

	const siteTitle = 'yesj1234.github.io';
	const siteOrigin = 'https://yesj1234.github.io';
	$: formattedTitle = title ? `${title} | ${siteTitle}` : siteTitle;
	$: imageUrl = image ? `${siteOrigin}${image}` : undefined;
</script>

<svelte:head>
	<title>{formattedTitle}</title>
	<meta name="description" content={description} />
	<meta property="og:site_name" content={siteTitle} />
	<meta property="og:title" content={title || siteTitle} />
	<meta property="og:description" content={description} />
	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={imageUrl} />
	{/if}
</svelte:head>

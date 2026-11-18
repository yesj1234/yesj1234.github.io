<script lang="ts">
	import { absoluteUrl, jsonLd, SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';

	export let title: string;
	export let description: string = SITE_DESCRIPTION;
	/** 사이트 루트 기준 경로(`/posts/x`). canonical·og:url 이 된다 */
	export let path: string;
	/** 사이트 루트 기준 이미지 경로(`/posts/x/cover.webp`). 공유 미리보기 이미지로 쓴다 */
	export let image: string | undefined = undefined;
	export let type: 'website' | 'article' | 'profile' = 'website';
	/** article 일 때 ISO 8601 작성 시각 */
	export let publishedTime: string | undefined = undefined;
	export let tags: string[] = [];
	/** 구조화 데이터(JSON-LD). 객체 하나 또는 @graph 배열 */
	export let structuredData: unknown = undefined;

	$: formattedTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;
	$: url = absoluteUrl(path);
	$: imageUrl = image ? absoluteUrl(image) : undefined;
</script>

<svelte:head>
	<title>{formattedTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:site_name" content={SITE_TITLE} />
	<meta property="og:locale" content="ko_KR" />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title || SITE_TITLE} />
	<meta property="og:description" content={description} />
	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={imageUrl} />
	{:else}
		<meta name="twitter:card" content="summary" />
	{/if}
	{#if type === 'article' && publishedTime}
		<meta property="article:published_time" content={publishedTime} />
		{#each tags as tag}<meta property="article:tag" content={tag} />{/each}
	{/if}
	{#if structuredData}
		{@html jsonLd(structuredData)}
	{/if}
</svelte:head>

import type { PageServerLoad } from './$types';
import { slugFromPath } from '$lib/slugFromPath';
export const load: PageServerLoad = async ({ url }) => {
	const currentTag = url.pathname.split('/').at(-1);
	const modules = import.meta.glob(`/src/post_items/*.md`);
	const postPromises = Object.entries(modules).map(([path, resolver]) =>
		resolver().then(
			(post) =>
				({
					slug: slugFromPath(path),
					...(post as unknown as App.MdsvexFile).metadata
				}) as App.BlogPost
		)
	);

	const posts = await Promise.all(postPromises);
	const publishedPosts = posts
		.filter((post) => post.published)
		.filter((post) => post.tags?.includes(currentTag as unknown as string));

	publishedPosts.sort((a, b) => (new Date(a.date) > new Date(b.date) ? -1 : 1));
	return { posts: publishedPosts };
};

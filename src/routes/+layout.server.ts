import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const modules = import.meta.glob(`/src/post_items/*.md`);

	const postPromises = Object.entries(modules).map(([, resolver]) =>
		resolver().then(
			(post) => ({ ...(post as unknown as App.MdsvexTags).metadata }) as unknown as App.TagsPost
		)
	);
	const posts = await Promise.all(postPromises);
	const publishedPosts = posts.filter((post) => post.published);
	publishedPosts.sort((a, b) => (new Date(a.date) > new Date(b.date) ? -1 : 1));
	const tags = new Set();
	publishedPosts.forEach((post) => {
		if (post.tags) {
			for (const tag in post.tags) {
				tags.add(post.tags[tag]);
			}
		}
	});
	return { tags: tags };
};

export const prerender = 'auto';

import { slugFromPath } from '$lib/slugFromPath';
import { toIsoDate } from '$lib/utils/date_utils';
import type { PageServerLoad } from './$types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const load: PageServerLoad = async ({ params }) => {
	const modules = import.meta.glob(`/src/post_items/*.md`);

	const postPromises = Object.entries(modules).map(([path, resolver]) =>
		resolver().then(
			(post) =>
				({
					slug: slugFromPath(path),
					...(post as unknown as App.MdsvexTags).metadata
				}) as unknown as App.TagsPost
		)
	);
	const posts = await Promise.all(postPromises);
	const publishedPosts = posts.filter((post) => post.published);
	publishedPosts.sort((a, b) => toIsoDate(b.date).localeCompare(toIsoDate(a.date)));
	const tags = new Set();
	publishedPosts.forEach((post) => {
		if (post.tags) {
			for (const tag in post.tags) {
				tags.add(post.tags[tag]);
			}
		}
	});
	return { publishedPosts, tags };
};

export const prerender = 'auto';

import type { PageServerLoad } from './$types';
import { loadPublishedPosts } from '$lib/posts';

const MAX_POSTS = 50;

export const load: PageServerLoad = async () => {
	const posts = await loadPublishedPosts();
	return { posts: posts.slice(0, MAX_POSTS) };
};

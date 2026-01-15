import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@tg-svelte/kit/vite';

export default {
	plugins: [enhancedImages(), sveltekit()],
	server: {
		fs: {
			allow: ['../../packages/kit']
		}
	}
};

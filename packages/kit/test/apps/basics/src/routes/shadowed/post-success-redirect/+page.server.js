import { redirect } from '@tg-svelte/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: () => {
		redirect(303, '/shadowed/post-success-redirect/redirected');
	}
};

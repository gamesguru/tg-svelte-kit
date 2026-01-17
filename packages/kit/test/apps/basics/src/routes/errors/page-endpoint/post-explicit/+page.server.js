import { error } from '@tg-svelte/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: () => {
		error(400, 'oops');
	}
};

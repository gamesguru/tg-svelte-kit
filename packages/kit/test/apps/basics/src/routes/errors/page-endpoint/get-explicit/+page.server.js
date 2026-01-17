import { error } from '@tg-svelte/kit';

export const load = () => {
	error(400, 'oops');
};

import { error } from '@tg-svelte/kit';

/** @type {import('./$types').PageLoad} */
export async function load() {
	if (typeof window !== 'undefined') {
		error(555, 'Not found');
	}

	return {};
}

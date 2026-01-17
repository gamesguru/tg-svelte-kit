import { error } from '@tg-svelte/kit';

export async function load() {
	if (typeof window !== 'undefined') {
		error(401, undefined);
	}
	return {};
}

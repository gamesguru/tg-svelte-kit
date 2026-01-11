import { error } from '@tg-svelte/kit';

export function load() {
	error(500, 'Error');
}

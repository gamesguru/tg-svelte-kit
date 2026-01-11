import { error } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export function load() {
	error(555, undefined);
}

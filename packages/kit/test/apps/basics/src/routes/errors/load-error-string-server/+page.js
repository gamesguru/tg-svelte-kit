import { error } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').Load} */
export async function load() {
	error(555, 'Not found');
}

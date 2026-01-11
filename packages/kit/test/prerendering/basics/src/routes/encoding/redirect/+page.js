import { redirect } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').Load} */
export function load() {
	redirect(307, '/encoding/redirected%20path%20with%20encoded%20spaces');
}

import { redirect } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').Load} */
export function load() {
	redirect(307, 'redirected?embedded=' + encodeURIComponent('/苗条?foo=bar&fizz=buzz'));
}

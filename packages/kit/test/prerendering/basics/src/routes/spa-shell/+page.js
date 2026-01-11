import { redirect } from '@tg-svelte/kit';

export const prerender = true;

export const ssr = false;

/** @type {import('@tg-svelte/kit').Load} */
export function load() {
	redirect(301, 'https://example.com/redirected');
}

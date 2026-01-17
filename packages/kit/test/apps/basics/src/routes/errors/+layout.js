import { error } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').Load} */
export async function load({ fetch, url }) {
	if (url.pathname.startsWith('/errors/error-in-layout')) {
		const res = await fetch('/errors/error-in-layout/non-existent');
		error(/** @type {404} */ (res.status));
	}
}

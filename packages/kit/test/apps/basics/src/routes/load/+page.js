import { browser } from '$app/environment';

/** @type {import('@tg-svelte/kit').Load} */
export function load(pageContext) {
	if (browser) {
		window.pageContext = pageContext;
	}
	return { foo: 'bar' };
}

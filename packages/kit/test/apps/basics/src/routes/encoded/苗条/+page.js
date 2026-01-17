/** @type {import('@tg-svelte/kit').Load} */
export function load({ url }) {
	return {
		path: url.pathname
	};
}

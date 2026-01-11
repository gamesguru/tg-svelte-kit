/** @type {import('@tg-svelte/kit').Load} */
export function load({ url }) {
	const { pathname: path } = url;
	return { path };
}

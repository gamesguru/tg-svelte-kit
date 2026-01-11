/** @type {import('@tg-svelte/kit').Load} */
export function load({ params }) {
	const { rest } = params;
	return { rest };
}

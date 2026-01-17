/** @type {import('@tg-svelte/kit').Load} */
export async function load({ params, fetch }) {
	const res = await fetch(`/load/${params.dynamic}.json`);
	return await res.json();
}

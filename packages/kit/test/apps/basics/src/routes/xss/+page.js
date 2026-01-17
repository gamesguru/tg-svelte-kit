/** @type {import('@tg-svelte/kit').Load} */
export async function load({ fetch }) {
	const res = await fetch('/xss.json');
	const user = await res.json();
	return { user };
}

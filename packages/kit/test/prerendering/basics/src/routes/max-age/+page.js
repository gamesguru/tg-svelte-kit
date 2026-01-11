/** @type {import('@tg-svelte/kit').Load} */
export function load({ setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=300'
	});
}

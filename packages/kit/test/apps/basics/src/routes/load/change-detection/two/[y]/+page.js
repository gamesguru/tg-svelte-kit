let count = 0;

/** @type {import('@tg-svelte/kit').Load} */
export async function load({ params, setHeaders }) {
	count += 1;

	setHeaders({
		'cache-control': 'max-age=5'
	});
	return {
		y: params.y,
		loads: count
	};
}

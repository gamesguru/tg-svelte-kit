import { json } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export function GET({ setHeaders }) {
	setHeaders({
		'x-test': '\u001f'
	});

	return json({});
}

import { json } from '@tg-svelte/kit';

/** @type {import('@tg-svelte/kit').RequestHandler} */
export function GET({ params }) {
	return json({
		name: params.dynamic
	});
}

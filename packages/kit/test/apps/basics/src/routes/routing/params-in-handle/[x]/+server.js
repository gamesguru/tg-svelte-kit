import { json } from '@tg-svelte/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ locals }) {
	return json({
		key: locals.key,
		params: locals.params
	});
}

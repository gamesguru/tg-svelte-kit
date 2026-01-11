import { json } from '@tg-svelte/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ request }) {
	return json(Object.fromEntries(request.headers));
}

import { json } from '@tg-svelte/kit';

/** @type {import('./$types').RequestHandler} */
export function GET(event) {
	return json({
		name: event.locals.name ?? 'Fail'
	});
}

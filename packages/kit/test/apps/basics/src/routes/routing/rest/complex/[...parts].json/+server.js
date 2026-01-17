import { json } from '@tg-svelte/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ params }) {
	return json({
		parts: params.parts
	});
}

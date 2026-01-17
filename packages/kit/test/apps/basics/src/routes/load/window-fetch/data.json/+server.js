import { json } from '@tg-svelte/kit';

/** @type {import('./$types').RequestHandler} */
export function GET() {
	return json({
		answer: 42
	});
}

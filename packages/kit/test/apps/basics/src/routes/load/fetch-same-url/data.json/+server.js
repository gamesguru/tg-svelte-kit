import { json } from '@tg-svelte/kit';

let result = 0;

/** @type {import('./$types').RequestHandler} */
export function GET() {
	result++;
	return json({ result });
}
